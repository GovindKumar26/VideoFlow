// server/controllers/ingestController.js

import File from "../models/file.js";
import { publishEvent } from "../events/publisher.js";
import asyncHandler from "../utils/asyncHandler.js";


export const programIngestVideo = asyncHandler(async (req, res) => {
    const { originalName, sourceUrl } = req.body;

    if (!originalName || !sourceUrl) {
        return res.status(400).json({ 
            message: "Missing parameters. Both 'originalName' and a downloadable 'sourceUrl' are required." 
        });
    }

    // 1. Pre-register a tracking record inside your MongoDB files collection
    const fileRecord = await File.create({
        owner: req.user.id,  // Injected cleanly by your validateApiKey middleware guard
        originalName,
        status: "processing", 
        allowedDomains: [],   
    });

    // 2. Formulate the core payload data structure
    const transcodePayload = {
        fileId: fileRecord._id,
        ownerId: req.user.id,
        originalName,
        sourceUrl
    };

    // 3. Fire the payload into RabbitMQ using your direct exchange utility topology
    try {
        const ROUTING_KEY = "video.ingest.requested";
        const eventId = await publishEvent(ROUTING_KEY, transcodePayload);
        
        // 4. Respond instantly with a 202 HTTP Accepted statement
        res.status(202).json({
            message: "Video ingestion handshake completed successfully. Transcoding job allocated.",
            fileId: fileRecord._id,
            eventId, // Your randomUUID() tracking reference 
            status: "processing",
            monitoringUrl: `${req.protocol}://${req.get("host")}/v1/media/status/${fileRecord._id}`
        });
    } catch (queueError) {
        // Fallback safety catch: Mark the document state as failed if your RabbitMQ layer breaks down
        fileRecord.status = "failed";
        await fileRecord.save();
        return res.status(500).json({ message: "Failed to allocate ingestion system worker task queue resources." });
    }
});