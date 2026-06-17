// server/models/ApiKey.js
import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50, // e.g., "Production Stack Server", "Testing Node Script"
        },
        hashedKey: {
            type: String,
            required: true,
            unique: true,
        },
        truncatedKey: {
            type: String,
            required: true, // e.g., "8x29"
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastUsedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export default mongoose.model("ApiKey", apiKeySchema);