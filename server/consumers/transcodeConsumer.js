import { getRabbitChannel, rabbitConfig } from "../config/rabbitmq.js";
import File from "../models/file.js";
import { createAndEmitNotification } from "../services/notificationService.js";
import { dispatchEventForUser } from "../services/webhookDeliveryService.js";

const TRANSCODED_QUEUE = "video.transcoded";
const FAILED_QUEUE = "video.failed";
const PROCESSING_QUEUE = "video.processing";
const DLQ_QUEUE = "video.dlq";
const ROUTING_KEY_TRANSCODED = "video.transcoded";
const ROUTING_KEY_FAILED = "video.failed";
const ROUTING_KEY_PROCESSING = "video.processing";
const ROUTING_KEY_DLQ = "video.dlq";

const queueOptions = {
    durable: true,
    arguments: {
        "x-dead-letter-exchange": rabbitConfig.exchange,
        "x-dead-letter-routing-key": ROUTING_KEY_DLQ
    }
};

const ensureDlq = async (channel) => {
    await channel.assertQueue(DLQ_QUEUE, { durable: true });
    await channel.bindQueue(DLQ_QUEUE, rabbitConfig.exchange, ROUTING_KEY_DLQ);
};

export const startTranscodeConsumer = async () => {
    const channel = await getRabbitChannel();

    await ensureDlq(channel);
    await channel.assertQueue(TRANSCODED_QUEUE, queueOptions);
    await channel.bindQueue(TRANSCODED_QUEUE, rabbitConfig.exchange, ROUTING_KEY_TRANSCODED);
    channel.prefetch(1);

    channel.consume(TRANSCODED_QUEUE, async (msg) => {
        if (!msg) {
            return;
        }

        try {
            const content = JSON.parse(msg.content.toString());
            const { payload } = content;
            const { fileId, renditions, mp4Renditions, completedAt, masterKey, thumbnailKey, previewKey } = payload;

            await File.findByIdAndUpdate(
                fileId,
                {
                    status: "transcoded",
                    transcodedAt: completedAt ? new Date(completedAt) : new Date(),
                    renditions: Array.isArray(renditions) ? renditions : [],
                    mp4Renditions: Array.isArray(mp4Renditions) ? mp4Renditions : [],
                    masterKey: masterKey || null,
                    thumbnailKey: thumbnailKey || null,
                    previewKey: previewKey || null,
                    lastError: null
                },
                { returnDocument: "after" }
            );

            const fileDoc = await File.findById(fileId).select("owner originalName status");
            if (fileDoc?.owner) {
                await createAndEmitNotification({
                    userId: fileDoc.owner,
                    title: "Transcoding complete",
                    message: `${fileDoc.originalName} is ready to watch.`,
                    type: "success",
                    data: { fileId, event: "video.transcoded" }
                });
            }

            if (fileDoc?.owner) {
                await dispatchEventForUser({
                    userId: fileDoc.owner,
                    event: "video.transcoded",
                    payload: {
                        fileId,
                        event: "video.transcoded",
                        renditions,
                        completedAt,
                        masterKey,
                        thumbnailKey,
                        previewKey
                    }
                });
            }

            channel.ack(msg);
        } catch (error) {
            console.error("Failed to process video.transcoded event:", error);
            channel.nack(msg, false, false);
        }
    });
};

export const startFailedConsumer = async () => {
    const channel = await getRabbitChannel();

    await ensureDlq(channel);
    await channel.assertQueue(FAILED_QUEUE, queueOptions);
    await channel.bindQueue(FAILED_QUEUE, rabbitConfig.exchange, ROUTING_KEY_FAILED);
    channel.prefetch(1);

    channel.consume(FAILED_QUEUE, async (msg) => {
        if (!msg) {
            return;
        }

        try {
            const content = JSON.parse(msg.content.toString());
            const { payload } = content;
            const { fileId, errorMessage, failedAt } = payload;

            await File.findByIdAndUpdate(
                fileId,
                {
                    status: "failed",
                    lastError: errorMessage || "Transcoding failed",
                    transcodedAt: failedAt ? new Date(failedAt) : new Date()
                },
                { returnDocument: "after" }
            );

            const fileDoc = await File.findById(fileId).select("owner originalName status lastError");
            if (fileDoc?.owner) {
                await createAndEmitNotification({
                    userId: fileDoc.owner,
                    title: "Transcoding failed",
                    message: `${fileDoc.originalName} could not be processed.`,
                    type: "error",
                    data: { fileId, event: "video.failed", errorMessage: fileDoc.lastError }
                });

                await dispatchEventForUser({
                    userId: fileDoc.owner,
                    event: "video.failed",
                    payload: {
                        fileId,
                        event: "video.failed",
                        errorMessage: fileDoc.lastError,
                        failedAt: failedAt ? new Date(failedAt).toISOString() : new Date().toISOString()
                    }
                });
            }

            channel.ack(msg);
        } catch (error) {
            console.error("Failed to process video.failed event:", error);
            channel.nack(msg, false, false);
        }
    });
};

export const startProcessingConsumer = async () => {
    const channel = await getRabbitChannel();

    await ensureDlq(channel);
    await channel.assertQueue(PROCESSING_QUEUE, queueOptions);
    await channel.bindQueue(PROCESSING_QUEUE, rabbitConfig.exchange, ROUTING_KEY_PROCESSING);
    channel.prefetch(1);

    channel.consume(PROCESSING_QUEUE, async (msg) => {
        if (!msg) {
            return;
        }

        try {
            const content = JSON.parse(msg.content.toString());
            const { payload } = content;
            const { fileId, startedAt } = payload;

            await File.findByIdAndUpdate(
                fileId,
                {
                    status: "processing",
                    lastError: null,
                    processingAt: startedAt ? new Date(startedAt) : new Date()
                },
                { returnDocument: "after" }
            );

            const fileDoc = await File.findById(fileId).select("owner originalName status");
            if (fileDoc?.owner) {
                await createAndEmitNotification({
                    userId: fileDoc.owner,
                    title: "Processing started",
                    message: `${fileDoc.originalName} is being transcoded.`,
                    type: "info",
                    data: { fileId, event: "video.processing" }
                });

                await dispatchEventForUser({
                    userId: fileDoc.owner,
                    event: "video.processing",
                    payload: {
                        fileId,
                        event: "video.processing",
                        startedAt: startedAt ? new Date(startedAt).toISOString() : new Date().toISOString()
                    }
                });
            }

            channel.ack(msg);
        } catch (error) {
            console.error("Failed to process video.processing event:", error);
            channel.nack(msg, false, false);
        }
    });
};
