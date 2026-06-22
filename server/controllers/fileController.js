// server/controllers/fileController.js
import crypto from "crypto";

import File from "../models/file.js";
import asyncHandler from "../utils/asyncHandler.js";

export const generateEmbedSignature = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: "Student email query parameter is required." });
    }

    const file = await File.findById(id);
    if (!file) {
        return res.status(404).json({ message: "Video resource not found." });
    }

    // Ensure the requester is actually the owner of the video file
    if (file.owner.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "Unauthorized to generate secure embeds for this file." });
    }

    // 🔒 Create a cryptographic signature combining file ID + lowercased student email
    const secret = process.env.JWT_SECRET || "change-me-in-prod";
    const signature = crypto
        .createHmac("sha256", secret)
        .update(`${id}-${email.toLowerCase().trim()}`)
        .digest("hex");

    res.status(200).json({ signature });
});