import mongoose from "mongoose";

const webhookSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    url: { type: String, required: true },
    secret: { type: String, required: true },
    events: [{ type: String }],
    lastDeliveryAt: Date,
    lastDeliveryStatus: { type: String, enum: ["success", "failed", "pending"] },
    createdAt: { type: Date, default: Date.now }
});

const Webhook = mongoose.model("Webhook", webhookSchema);

export default Webhook;
