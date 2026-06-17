// server/controllers/apiKeyController.js
import crypto from "crypto";

import ApiKey from "../models/ApiKey.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createApiKey = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Please provide a descriptive name for this token keyset." });
    }

    // 1. Generate 24 random bytes for high entropy and convert to hex string string
    const rawEntropy = crypto.randomBytes(24).toString("hex");
    const actualRawKey = `VF_API_KEY_${rawEntropy}`; // Full key structure

    // 2. Extract a small subset of the end characters for identification masks
    const truncatedKey = rawEntropy.slice(-4); // Grab last 4 characters

    // 3. Compute a secure SHA-256 hash hash string of the key for database matching records
    const hashedKey = crypto
        .createHash("sha256")
        .update(actualRawKey)
        .digest("hex");

    // 4. Record the schema document parameters inside your database collection layer
    await ApiKey.create({
        user: req.user.id, // Linked seamlessly from your auth middleware scope
        name,
        hashedKey,
        truncatedKey,
    });

    // 🚀 CRITICAL: Return the actualRawKey here. This is the ONLY time they will ever see it!
    res.status(201).json({
        message: "API authentication token generated successfully.",
        name,
        apiKey: actualRawKey, 
        warning: "Make sure to copy this token key parameter now. You will not be able to view it again."
    });
});

// Get all keys for the logged-in developer user (Masked)
export const getApiKeys = asyncHandler(async (req, res) => {
    const keys = await ApiKey.find({ user: req.user.id, isActive: true })
        .select("name truncatedKey createdAt lastUsedAt")
        .sort({ createdAt: -1 });

    res.status(200).json(keys);
});

// Revoke / Delete an API Key
export const revokeApiKey = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const apiKeyRecord = await ApiKey.findOne({ _id: id, user: req.user.id });
    if (!apiKeyRecord) {
        return res.status(404).json({ message: "Target authentication record mapping not found." });
    }

    await apiKeyRecord.deleteOne();
    res.status(200).json({ message: "API Token credentials signature successfully revoked." });
});