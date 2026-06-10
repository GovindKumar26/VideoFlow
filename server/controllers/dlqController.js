import asyncHandler from "../utils/asyncHandler.js";
import { getRabbitChannel, rabbitConfig } from "../config/rabbitmq.js";

const DLQ_QUEUE = "video.dlq";

const parseLimit = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
};

const safeParseJson = (value) => {
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

export const getDlqSummary = asyncHandler(async (req, res) => {
    const channel = await getRabbitChannel();
    const limit = parseLimit(req.query.limit, 5);

    const status = await channel.checkQueue(DLQ_QUEUE);
    const total = status.messageCount || 0;
    const sampleCount = Math.min(total, limit);
    const messages = [];

    for (let i = 0; i < sampleCount; i += 1) {
        const msg = await channel.get(DLQ_QUEUE, { noAck: false });
        if (!msg) {
            break;
        }

        const raw = msg.content.toString();
        const parsed = safeParseJson(raw);
        messages.push({
            eventId: parsed?.eventId || msg.properties.messageId || null,
            routingKey: parsed?.routingKey || msg.fields.routingKey || null,
            sentAt: parsed?.sentAt || null,
            payload: parsed?.payload || null
        });

        channel.nack(msg, false, true);
    }

    res.status(200).json({
        queue: DLQ_QUEUE,
        total,
        sampleCount: messages.length,
        messages
    });
});

export const requeueDlqMessages = asyncHandler(async (req, res) => {
    const channel = await getRabbitChannel();
    const limit = parseLimit(req.query.limit, 50);

    let processed = 0;
    for (let i = 0; i < limit; i += 1) {
        const msg = await channel.get(DLQ_QUEUE, { noAck: false });
        if (!msg) {
            break;
        }

        const raw = msg.content.toString();
        const parsed = safeParseJson(raw);
        const routingKey = parsed?.routingKey || msg.fields.routingKey || "video.uploaded";
        const body = Buffer.from(raw);

        channel.publish(rabbitConfig.exchange, routingKey, body, {
            contentType: msg.properties.contentType || "application/json",
            persistent: true,
            messageId: msg.properties.messageId,
            timestamp: msg.properties.timestamp
        });

        channel.ack(msg);
        processed += 1;
    }

    res.status(200).json({
        queue: DLQ_QUEUE,
        requeued: processed
    });
});

export const purgeDlq = asyncHandler(async (req, res) => {
    const channel = await getRabbitChannel();
    const result = await channel.purgeQueue(DLQ_QUEUE);

    res.status(200).json({
        queue: DLQ_QUEUE,
        purged: result.messageCount || 0
    });
});
