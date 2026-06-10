import Webhook from "../models/webhook.js";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";

export const createWebhook = asyncHandler(async (req, res) => {
    const { url, events } = req.body || {};
    if (!url) return res.status(400).json({ message: "url is required" });
    const secret = crypto.randomBytes(32).toString("hex");
    const webhook = new Webhook({ user: req.user.id, url, secret, events: Array.isArray(events) ? events : [] });
    await webhook.save();
    res.status(201).json({
        message: "Webhook created",
        webhook: {
            id: webhook._id,
            user: webhook.user,
            url: webhook.url,
            events: webhook.events,
            secret: webhook.secret,
            createdAt: webhook.createdAt
        }
    });
});

export const listWebhooks = asyncHandler(async (req, res) => {
    const webhooks = await Webhook.find({ user: req.user.id });
    res.status(200).json({ webhooks });
});

export const deleteWebhook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const webhook = await Webhook.findById(id);
    if (!webhook) return res.status(404).json({ message: "Not found" });
    if (webhook.user.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });
    await webhook.remove();
    res.status(200).json({ message: "Deleted" });
});
