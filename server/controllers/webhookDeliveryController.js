import asyncHandler from "../utils/asyncHandler.js";
import Webhook from "../models/webhook.js";
import WebhookDelivery from "../models/webhookDelivery.js";
import { retryWebhookDelivery } from "../services/webhookDeliveryService.js";

export const listWebhookDeliveries = asyncHandler(async (req, res) => {
    const webhook = await Webhook.findById(req.params.id);
    if (!webhook) return res.status(404).json({ message: "Not found" });
    if (webhook.user.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const deliveries = await WebhookDelivery.find({ webhook: webhook._id })
        .sort({ createdAt: -1 })
        .limit(100);

    res.status(200).json({ deliveries });
});

export const retryDelivery = asyncHandler(async (req, res) => {
    const delivery = await WebhookDelivery.findById(req.params.deliveryId);
    if (!delivery) return res.status(404).json({ message: "Delivery not found" });

    const webhook = await Webhook.findById(delivery.webhook);
    if (!webhook) return res.status(404).json({ message: "Webhook not found" });
    if (webhook.user.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    const result = await retryWebhookDelivery({ deliveryId: delivery._id });
    res.status(202).json({ message: "Retry queued", result });
});
