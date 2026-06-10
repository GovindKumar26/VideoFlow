import crypto from "crypto";
import Webhook from "../models/webhook.js";
import WebhookDelivery from "../models/webhookDelivery.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_MAX_ATTEMPTS = Number(process.env.WEBHOOK_MAX_ATTEMPTS || 3);
const DEFAULT_INITIAL_BACKOFF_MS = Number(process.env.WEBHOOK_INITIAL_BACKOFF_MS || 1000);
const DEFAULT_TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS || 5000);

const truncate = (value, maxLength = 2000) => {
    if (value == null) return value;
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const buildSignature = ({ secret, timestamp, body }) => {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(`${timestamp}.${body}`);
    return hmac.digest("hex");
};

const postWebhook = async ({ webhook, event, payload, attempt, retryOf }) => {
    const body = JSON.stringify({ event, payload, webhookId: webhook._id.toString(), attempt });
    const timestamp = Date.now().toString();
    const signature = buildSignature({ secret: webhook.secret, timestamp, body });

    const requestHeaders = {
        "content-type": "application/json",
        "x-webhook-id": webhook._id.toString(),
        "x-webhook-event": event,
        "x-webhook-attempt": String(attempt),
        "x-webhook-timestamp": timestamp,
        "x-webhook-signature": signature
    };

    const delivery = await WebhookDelivery.create({
        webhook: webhook._id,
        user: webhook.user,
        event,
        payload,
        attempt,
        status: "pending",
        signature,
        requestHeaders,
        retryOf
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
        const response = await fetch(webhook.url, {
            method: "POST",
            headers: requestHeaders,
            body,
            signal: controller.signal
        });

        const responseText = truncate(await response.text());

        if (!response.ok) {
            await WebhookDelivery.findByIdAndUpdate(delivery._id, {
                status: "failed",
                responseStatus: response.status,
                responseBody: responseText,
                errorMessage: `HTTP ${response.status}`,
                deliveredAt: new Date(),
                nextRetryAt: null
            });

            const error = new Error(`Webhook returned HTTP ${response.status}`);
            error.responseStatus = response.status;
            error.responseBody = responseText;
            throw error;
        }

        await WebhookDelivery.findByIdAndUpdate(delivery._id, {
            status: "success",
            responseStatus: response.status,
            responseBody: responseText,
            deliveredAt: new Date(),
            nextRetryAt: null
        });

        return { ok: true, deliveryId: delivery._id, responseStatus: response.status };
    } catch (error) {
        await WebhookDelivery.findByIdAndUpdate(delivery._id, {
            status: "failed",
            errorMessage: error.name === "AbortError" ? "Webhook timed out" : error.message,
            deliveredAt: new Date(),
            nextRetryAt: null,
            responseBody: truncate(error.responseBody)
        });
        throw error;
    } finally {
        clearTimeout(timeout);
    }
};

export const dispatchWebhookEvent = async ({ webhook, event, payload, retryOf = null }) => {
    let lastError = null;

    for (let attempt = 1; attempt <= DEFAULT_MAX_ATTEMPTS; attempt += 1) {
        try {
            const result = await postWebhook({ webhook, event, payload, attempt, retryOf });
            await Webhook.findByIdAndUpdate(webhook._id, {
                lastDeliveryAt: new Date(),
                lastDeliveryStatus: "success"
            });
            return { ...result, attempts: attempt };
        } catch (error) {
            lastError = error;
            const nextRetryAt = attempt < DEFAULT_MAX_ATTEMPTS
                ? new Date(Date.now() + DEFAULT_INITIAL_BACKOFF_MS * (2 ** (attempt - 1)))
                : null;

            await WebhookDelivery.updateMany(
                { webhook: webhook._id, event, status: "failed", attempt },
                { $set: { nextRetryAt } }
            );

            if (attempt < DEFAULT_MAX_ATTEMPTS) {
                await sleep(DEFAULT_INITIAL_BACKOFF_MS * (2 ** (attempt - 1)));
                continue;
            }
        }
    }

    await Webhook.findByIdAndUpdate(webhook._id, {
        lastDeliveryAt: new Date(),
        lastDeliveryStatus: "failed"
    });

    throw lastError;
};

export const dispatchEventForUser = async ({ userId, event, payload }) => {
    const hooks = await Webhook.find({ user: userId, events: event });
    const results = [];

    for (const hook of hooks) {
        try {
            const result = await dispatchWebhookEvent({ webhook: hook, event, payload });
            results.push({ webhookId: hook._id, status: "success", ...result });
        } catch (error) {
            results.push({ webhookId: hook._id, status: "failed", errorMessage: error.message });
        }
    }

    return results;
};

export const retryWebhookDelivery = async ({ deliveryId }) => {
    const original = await WebhookDelivery.findById(deliveryId);
    if (!original) {
        throw new Error("Delivery log not found");
    }

    const webhook = await Webhook.findById(original.webhook);
    if (!webhook) {
        throw new Error("Webhook not found");
    }

    return dispatchWebhookEvent({
        webhook,
        event: original.event,
        payload: original.payload,
        retryOf: original._id
    });
};
