import mongoose from "mongoose";

const webhookDeliverySchema = new mongoose.Schema({
    webhook: { type: mongoose.Schema.Types.ObjectId, ref: "Webhook", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    attempt: { type: Number, required: true },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    signature: String,
    requestHeaders: { type: mongoose.Schema.Types.Mixed, default: {} },
    responseStatus: Number,
    responseBody: String,
    errorMessage: String,
    nextRetryAt: Date,
    deliveredAt: Date,
    retryOf: { type: mongoose.Schema.Types.ObjectId, ref: "WebhookDelivery" },
    createdAt: { type: Date, default: Date.now }
});

const WebhookDelivery = mongoose.model("WebhookDelivery", webhookDeliverySchema);

export default WebhookDelivery;
