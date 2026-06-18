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
    await Webhook.deleteOne({ _id: id });
    res.status(200).json({ message: "Deleted" });
});



// server/controllers/webhookController.js

export const updateWebhook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { url, events } = req.body;

    // 1. Locate the target document context
    const webhook = await Webhook.findById(id);
    if (!webhook) {
        return res.status(404).json({ message: "Webhook endpoint configuration context not found." });
    }

    // 2. Rigid Access Guard: Ensure the authenticated user owns this document record
    if (webhook.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: Access allocation denied." });
    }

    // 3. Mutate fields selectively if provided in the request payload
    if (url !== undefined) {
        if (!url) return res.status(400).json({ message: "Destination target URL string cannot be empty." });
        webhook.url = url;
    }
    
    if (events !== undefined) {
        if (!Array.isArray(events) || events.length === 0) {
            return res.status(400).json({ message: "Events specification must be a populated non-empty array sequence." });
        }
        webhook.events = events;
    }

    // 4. Save updates to fire standard Mongoose model schemas constraints validations
    await webhook.save();

    res.status(200).json({ 
        message: "⚙️ Webhook configurations updated and synced successfully.", 
        webhook 
    });
});