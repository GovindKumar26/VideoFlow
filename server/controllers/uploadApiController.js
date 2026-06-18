// server/controllers/uploadApiController.js
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import crypto from "crypto";
import s3Client from "../config/s3.js";
import File from "../models/File.js";
import asyncHandler from "../utils/asyncHandler.js";

// export const generatePassthroughUrl = asyncHandler(async (req, res) => {
//     const { originalName, contentType } = req.body;

//     if (!originalName) {
//         return res.status(400).json({ message: "Missing parameter: 'originalName' is required." });
//     }

//     // 1. Establish a secure, isolated storage key inside your raw uploads directory
//     const fileId = new crypto.randomUUID();
//     const fileExtension = originalName.includes(".") ? originalName.split(".").pop() : "mp4";
//     const s3Key = `raw-uploads/${req.user.id}/${fileId}.${fileExtension}`;

//     // 2. Pre-register the tracking document in MongoDB as 'pending'
//     const fileRecord = await File.create({
//         owner: req.user.id, // Set securely by your validateApiKey middleware
//         originalName,
//         status: "pending", // Waiting for the browser upload to complete
//         allowedDomains: [],
//     });

//     // 3. Formulate the S3 PutObject configuration command
//     const command = new PutObjectCommand({
//         Bucket: process.env.S3_BUCKET_NAME,
//         Key: s3Key,
//         ContentType: contentType || "video/mp4",
//     });

//     // 4. Generate a secure presigned upload URL expiring in 15 minutes (900 seconds)
//     const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

//     // 5. Respond to the developer server instantly
//     res.status(200).json({
//         message: "Secure passthrough upload tokens generated successfully.",
//         fileId: fileRecord._id,
//         uploadUrl,
//         s3Key, // Returned so the dev can reference it or track completion states
//     });
// });

export const generatePassthroughUrl = asyncHandler(async (req, res) => {
    const { originalName, contentType } = req.body;

    if (!originalName) {
        return res.status(400).json({ message: "Missing parameter: 'originalName' is required." });
    }

    // 1. Pre-register the tracking document in MongoDB to get a clean Mongoose ObjectId
    const fileRecord = await File.create({
        owner: req.user.id,
        originalName,
        status: "pending", // Waiting for the browser upload to complete
        allowedDomains: [],
    });

    // 2. Convert the ObjectId instance explicitly to a raw string for the S3 Key path
    const fileIdStr = fileRecord._id.toString();
    const fileExtension = originalName.includes(".") ? originalName.split(".").pop() : "mp4";
    const s3Key = `raw-uploads/${req.user.id}/${fileIdStr}.${fileExtension}`;

    // 3. Formulate the S3 PutObject configuration command
    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        ContentType: contentType || "video/mp4",
    });

    // 4. Generate a secure presigned upload URL expiring in 15 minutes
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // 5. Respond to the developer server instantly
    res.status(200).json({
        message: "Secure passthrough upload tokens generated successfully.",
        fileId: fileIdStr, // Explicit string format matching the S3 path folder structure!
        uploadUrl,
        s3Key, 
    });
});


// Append to server/controllers/uploadApiController.js
import { publishEvent } from "../events/publisher.js";

export const confirmPassthroughUpload = asyncHandler(async (req, res) => {
    const { fileId, s3Key } = req.body;

    if (!fileId || !s3Key) {
        return res.status(400).json({ message: "Missing tracking parameters: 'fileId' and 's3Key' are required." });
    }

    // 1. Update the document from pending to processing
    const fileRecord = await File.findByIdAndUpdate(
        fileId,
        { status: "processing" },
        { new: true }
    );

    if (!fileRecord) {
        return res.status(404).json({ message: "Target upload record tracking context not found." });
    }

    // 2. Dispatch a message to your active RabbitMQ Direct Exchange 
    // This feeds directly into your existing 'startTranscodeConsumer' background worker pool!
    const ROUTING_KEY_UPLOADED = "video.uploaded";
    await publishEvent(ROUTING_KEY_UPLOADED, {
        fileId: fileRecord._id,
        s3Key,
    });

    res.status(200).json({
        message: "Upload handoff confirmed. Ingestion background workers dispatched successfully.",
        fileId: fileRecord._id,
        status: "processing"
    });
});