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
import File from "../models/File.js";
import dbConnect from "../config/database.js";

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

// 🎯 Highly optimized native child process execution layer with real-time feedback
const runFfmpeg = (args, fileId = "unknown") => {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(ffmpegPath || "ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
        let stderr = "";

        ffmpeg.stderr.on("data", (data) => {
            const chunk = data.toString();
            stderr += chunk;

            // 🔍 Regex pattern captures raw frame count and time benchmarks from the FFmpeg stream
            const frameMatch = chunk.match(/frame=\s*(\d+)/);
            const timeMatch = chunk.match(/time=\s*([\d:.]+)/);

            if (frameMatch || timeMatch) {
                const frames = frameMatch ? frameMatch[1] : "processing";
                const timeStr = timeMatch ? timeMatch[1] : "...";
                // Continuous clean inline terminal updates
                process.stdout.write(`\r⚡ [FFmpeg Studio Engine] File: ${fileId} -> Rendered Frames: ${frames} | Elapsed Media Time: ${timeStr}`);
            }
        });

        ffmpeg.on("error", (error) => reject(error));
        ffmpeg.on("close", (code) => {
            process.stdout.write("\n"); // Reset console line wrap
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`FFmpeg Studio Thread exited with code ${code}: ${stderr}`));
            }
        });
    });
};

const processStudioEdit = async (inputPath, outputPath, trim, crop, fileId) => {
    await ensureDir(path.dirname(outputPath));

    const args = ["-y"];

    // ✂️ TRIMMING COMPILATION (Safe Default Allocation)
    if (trim && typeof trim.start === "number" && typeof trim.end === "number") {
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

    // Standard h264 encoder args matching your platform standard guidelines
    args.push(
        "-c:a", "aac",
        "-ar", "48000",
        "-c:v", "h264",
        "-profile:v", "main",
        "-crf", "20",
        "-movflags", "+faststart",
        outputPath
    );

    await runFfmpeg(args, fileId);
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
        let activeFileId = null;
        let activeExportId = null;

        try {
            console.log("Received video.studio_tasks message");
            const content = JSON.parse(msg.content.toString());

            // 🎯 Read the dynamic source key passed down from the controller

            const { fileId, exportId, s3Key, trim, crop } = content;

            // Assign to our outer scoped fallback mirrors
            activeFileId = fileId;
            activeExportId = exportId;

            if (!s3Key) {
                throw new Error(`Missing raw object s3Key for fileId: ${fileId}`);
            }

            console.log(`Processing edits for fileId=${fileId} using Source Key=${s3Key}`);

            await publishEvent("video.editing_started", {
                fileId,
                startedAt: new Date().toISOString()
            });

            baseDir = path.join(os.tmpdir(), "studio-edits", fileId);
            const inputPath = path.join(baseDir, "source.mp4");
            const outputPath = path.join(baseDir, "edited_output.mp4");

            // 🎯 1. Download the raw file out of MinIO root using the precise string key
            await downloadFromS3(process.env.S3_BUCKET_NAME, s3Key, inputPath);
            console.log(`Clean download completed for source file asset: ${s3Key}`);

            // 2. Run the dynamic native clip processing engine layout
            await processStudioEdit(inputPath, outputPath, trim, crop, fileId);
            console.log("FFmpeg trimming/cropping completed successfully");

            // 🎯 3. Save the edited master cleanly inside a structured folder
            const editedS3Key = `mp4/${fileId}/exports/${exportId}/edited_output.mp4`;

            await uploadFileToS3(process.env.S3_BUCKET_NAME, outputPath, editedS3Key, "video/mp4");
            console.log(`Uploaded edited master video to structured path: ${editedS3Key}`);

            await File.updateOne(
                { _id: fileId, "exports._id": exportId },
                {
                    $set: {
                        "exports.$.status": "completed",
                        "exports.$.masterKey": editedS3Key
                    }
                }
            );
            console.log(`Updated database record status to 'completed' for exportId=${exportId}`);

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

                if (activeFileId && activeExportId) {
                    await File.updateOne(
                        { _id: activeFileId, "exports._id": activeExportId },
                        {
                            $set: {
                                "exports.$.status": "completed",
                                "exports.$.masterKey": editedS3Key // Saves the unique isolated path!
                            }
                        }
                    );
                }
                const content = msg ? JSON.parse(msg.content.toString()) : null;
                await publishEvent("video.editing_failed", {
                    fileId: content?.fileId,
                    errorMessage: error.message,
                    failedAt: new Date().toISOString()
                });
                // 🎯 ADD THIS: Flip database node to 'failed' on unhandled worker rejections

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


const initializeEngine = async () => {
    try {
        console.log("🔄 Initializing VideoFlow Studio background infrastructure...");

        // 1. Establish independent connection thread to MongoDB cluster
        await dbConnect();

        // 2. Fire up the shared RabbitMQ virtual channel networks
        await startWorker();

    } catch (error) {
        console.error("❌ Critical Engine initialization initialization failure:", error);
        process.exit(1);
    }
};

// Fire the updated cluster initialization chain
initializeEngine();

