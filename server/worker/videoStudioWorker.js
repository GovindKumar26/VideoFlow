import dotenv from "dotenv";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { pipeline } from "node:stream/promises";
import { createWriteStream, createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import s3Client from "../config/s3.js";
import { getRabbitChannel, rabbitConfig } from "../config/rabbitmq.js";
import { publishEvent } from "../events/publisher.js";

dotenv.config();

const STUDIO_QUEUE = "video.studio_tasks";
const DLQ_QUEUE = "video.studio_dlq";
const ROUTING_KEY_STUDIO = "video.studio_tasks";
const ROUTING_KEY_DLQ = "video.studio_dlq";

const queueOptions = {
    durable: true,
    arguments: {
        "x-dead-letter-exchange": rabbitConfig.exchange,
        "x-dead-letter-routing-key": ROUTING_KEY_DLQ
    }
};

const ensureDir = async (dirPath) => {
    await fs.mkdir(dirPath, { recursive: true });
};

const downloadFromS3 = async (bucket, key, destination) => {
    const { Body } = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!Body) throw new Error("Empty S3 object body");
    await ensureDir(path.dirname(destination));
    await pipeline(Body, createWriteStream(destination));
};

const uploadFileToS3 = async (bucket, filePath, key, contentType) => {
    const body = createReadStream(filePath);
    await s3Client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType
        })
    );
};

// 🎯 Reusing your highly optimized, clean native child process execution layer
const runFfmpeg = (args) => {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath || "ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
        let stderr = "";

        ffmpeg.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        ffmpeg.on("error", (error) => reject(error));
        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg Studio Thread exited with code ${code}: ${stderr}`));
            }
        });
    });
};

const processStudioEdit = async (inputPath, outputPath, trim, crop) => {
    await ensureDir(path.dirname(outputPath));
    
    // Begin assembling your raw string arrays for the shell execution thread
    const args = ["-y"];

    // ✂️ TRIMMING COMPILATION (Fast Seek Allocation)
    if (trim) {
        const duration = trim.end - trim.start;
        args.push("-ss", trim.start.toString(), "-i", inputPath, "-t", duration.toString());
    } else {
        args.push("-i", inputPath);
    }

    // 📐 ASPECT RATIO SPATIAL FILTERS (Dynamic Resolution Auto-Centering)
    if (crop && crop.ratio !== "16:9") {
        let scaleFilter = "";
        if (crop.ratio === "9:16") {
            scaleFilter = "crop=in_h*(9/16):in_h:(in_w-(in_h*(9/16)))/2:0";
        } else if (crop.ratio === "1:1") {
            scaleFilter = "crop=in_h:in_h:(in_w-in_h)/2:0";
        }

        if (scaleFilter) {
            args.push("-vf", scaleFilter);
        }
    }

    // Standard h264 encoder delivery args matching your existing transcoding parameters
    args.push(
        "-c:a", "aac",
        "-ar", "48000",
        "-c:v", "h264",
        "-profile:v", "main",
        "-crf", "20",
        "-movflags", "+faststart",
        outputPath
    );

    await runFfmpeg(args);
};

const ensureDlq = async (channel) => {
    await channel.assertQueue(DLQ_QUEUE, { durable: true });
    await channel.bindQueue(DLQ_QUEUE, rabbitConfig.exchange, ROUTING_KEY_DLQ);
};

const startWorker = async () => {
    const channel = await getRabbitChannel();

    await ensureDlq(channel);
    await channel.assertQueue(STUDIO_QUEUE, queueOptions);
    await channel.bindQueue(STUDIO_QUEUE, rabbitConfig.exchange, ROUTING_KEY_STUDIO);
    channel.prefetch(1);

    console.log("🚀 [Worker] Studio Task Engine listening for RabbitMQ events...");

    channel.consume(STUDIO_QUEUE, async (msg) => {
        if (!msg) return;

        let baseDir = null;
        try {
            console.log("Received video.studio_tasks message");
            const content = JSON.parse(msg.content.toString());
            const { fileId, trim, crop } = content;

            console.log(`Processing edits for fileId=${fileId}`);

            await publishEvent("video.editing_started", {
                fileId,
                startedAt: new Date().toISOString()
            });

            baseDir = path.join(os.tmpdir(), "studio-edits", fileId);
            const inputPath = path.join(baseDir, "source.mp4");
            const outputPath = path.join(baseDir, "edited_output.mp4");

            // 1. Fetch original master source out of S3/MinIO
            const s3Key = `uploads/${fileId}/source.mp4`; 
            await downloadFromS3(process.env.S3_BUCKET_NAME, s3Key, inputPath);
            console.log("Downloaded source from S3 for editing");

            // 2. Run the dynamic native clip processing engine layout
            await processStudioEdit(inputPath, outputPath, trim, crop);
            console.log("FFmpeg trimming/cropping completed successfully");

            // 3. Upload the newly modified clean master back up to the cloud storage layer
            const editedS3Key = `uploads/${fileId}/edited_source.mp4`;
            await uploadFileToS3(process.env.S3_BUCKET_NAME, outputPath, editedS3Key, "video/mp4");
            console.log("Uploaded edited master video back to S3 container");

            // 4. Notify your system architecture to rerun the standard HLS Transcoding pipeline blocks!
            await publishEvent("video.edited_ready_to_transcode", {
                fileId,
                s3Key: editedS3Key,
                completedAt: new Date().toISOString()
            });
            console.log(`Published video.edited_ready_to_transcode event for fileId=${fileId}`);

            channel.ack(msg);
        } catch (error) {
            console.error("Worker failed to process video studio task:", error);

            try {
                const content = msg ? JSON.parse(msg.content.toString()) : null;
                await publishEvent("video.editing_failed", {
                    fileId: content?.fileId,
                    errorMessage: error.message,
                    failedAt: new Date().toISOString()
                });
            } catch (publishError) {
                console.error("Failed to publish video.editing_failed event:", publishError);
            }

            channel.nack(msg, false, false);
        } finally {
            if (baseDir) {
                await fs.rm(baseDir, { recursive: true, force: true });
            }
        }
    });
};

startWorker().catch((error) => {
    console.error("Studio Worker initialization crash state flag:", error);
    process.exit(1);
});