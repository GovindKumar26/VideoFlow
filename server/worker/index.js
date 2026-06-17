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
import sharp from "sharp";

dotenv.config();

const UPLOADED_QUEUE = "video.uploaded";
const DLQ_QUEUE = "video.dlq";
const ROUTING_KEY_UPLOADED = "video.uploaded";
const ROUTING_KEY_DLQ = "video.dlq";

const queueOptions = {
    durable: true,
    arguments: {
        "x-dead-letter-exchange": rabbitConfig.exchange,
        "x-dead-letter-routing-key": ROUTING_KEY_DLQ
    }
};

const renditions = [
    { name: "hls-1080p", width: 1920, height: 1080, bitrateK: 5000 },
    { name: "hls-720p", width: 1280, height: 720, bitrateK: 2800 },
    { name: "hls-480p", width: 854, height: 480, bitrateK: 1400 }
];

// Inside your Transcoding Worker file

const buildWatermarkedFilter = (rendition) => {
    // Standard baseline scale sequence parameters
    const baseScale = `scale=w=${rendition.width}:h=${rendition.height}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;

    // THE LOGO CONTAINER: Renders a clean black backdrop bar block
    const logoBox = `drawbox=x=20:y=20:w=140:h=40:color=black@0.7:t=fill`;

    // THE LOGO TEXT: Dropped letter_spacing parameter cleanly to prevent Essentials build crashes
    const logoText = `drawtext=text='VIDEOFLOW':x=35:y=32:fontsize=18:fontcolor=white`;

    return `${baseScale},${logoBox},${logoText}`;
};

const ensureDir = async (dirPath) => {
    await fs.mkdir(dirPath, { recursive: true });
};

const downloadFromS3 = async (bucket, key, destination) => {
    const { Body } = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!Body) {
        throw new Error("Empty S3 object body");
    }
    await ensureDir(path.dirname(destination));
    await pipeline(Body, createWriteStream(destination));
};

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
                reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
            }
        });
    });
};

const LOGO_ASSET_PATH = path.join(process.cwd(), "assets", "videoflow-watermark.svg");

const transcodeToHls = async (inputPath, outputDir) => {
    await ensureDir(outputDir);

    const tempPngLogoPath = path.join(os.tmpdir(), "videoflow-watermark.png");
    await sharp(LOGO_ASSET_PATH)
        .resize({ width: 320 }) // Give it a crisp resolution baseline before FFmpeg downsizes it
        .png()
        .toFile(tempPngLogoPath);

    for (const rendition of renditions) {
        const playlistPath = path.join(outputDir, `${rendition.name}.m3u8`);
        const segmentPattern = path.join(outputDir, `${rendition.name}_%05d.ts`);
        const scaleFilter = `scale=w=${rendition.width}:h=${rendition.height}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;
        const filterComplex = buildWatermarkedFilter(rendition);

        const filterComplexString = `[0:v]${scaleFilter},drawbox=x=10:y=10:w=180:h=48:color=black@0.7:t=fill[scaled];[1:v]scale=160:-1[logo];[scaled][logo]overlay=20:14`;
        const args = [
            "-y",
            "-i",
            inputPath,
            "-i", tempPngLogoPath,
            "-filter_complex",
            `[0:v]${scaleFilter},drawbox=x=10:y=10:w=180:h=48:color=black@0.7:t=fill[scaled];[1:v]scale=160:-1[logo];[scaled][logo]overlay=20:14`,
            
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-c:v",
            "h264",
            "-profile:v",
            "main",
            "-crf",
            "20",
            "-sc_threshold",
            "0",
            "-g",
            "48",
            "-keyint_min",
            "48",
            "-hls_time",
            "4",
            "-hls_playlist_type",
            "vod",
            "-hls_segment_filename",
            segmentPattern,
            "-f",
            "hls",
            playlistPath
        ];

        await runFfmpeg(args);
    } 
    // Clean up temporary PNG file after transcoding iterations complete
    try {
        await fs.unlink(tempPngLogoPath);
    } catch (e) {}

    const masterPlaylist = ["#EXTM3U", "#EXT-X-VERSION:3"];
    for (const rendition of renditions) {
        const bandwidth = rendition.bitrateK * 1000;
        masterPlaylist.push(`#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${rendition.width}x${rendition.height}`);
        masterPlaylist.push(`${rendition.name}.m3u8`);
    }

    await fs.writeFile(path.join(outputDir, "master.m3u8"), masterPlaylist.join("\n"));
};

const transcodeToMp4Renditions = async (inputPath, outputDir) => {
    await ensureDir(outputDir);

    const tempPngLogoPath = path.join(os.tmpdir(), "videoflow-watermark-mp4.png");
    await sharp(LOGO_ASSET_PATH)
        .resize({ width: 320 })
        .png()
        .toFile(tempPngLogoPath);

    for (const rendition of renditions) {
        const outputPath = path.join(outputDir, `${rendition.name}.mp4`);
        const scaleFilter = `scale=w=${rendition.width}:h=${rendition.height}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2`;
        const filterComplex = buildWatermarkedFilter(rendition);
        const filterComplexString = `[0:v]${scaleFilter},drawbox=x=10:y=10:w=180:h=48:color=black@0.7:t=fill[scaled];[1:v]scale=160:-1[logo];[scaled][logo]overlay=20:14`;

        const args = [
            "-y",
            "-i",
            inputPath,
             "-i", tempPngLogoPath,
            "-filter_complex", 
            filterComplexString,
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-c:v",
            "h264",
            "-profile:v",
            "main",
            "-crf",
            "20",
            "-movflags",
            "+faststart",
            outputPath
        ];

        await runFfmpeg(args);
    }
};

const generateThumbnail = async (inputPath, outputPath) => {
    await ensureDir(path.dirname(outputPath));
    const args = [
        "-y",
        "-i",
        inputPath,
        "-ss",
        "00:00:02",
        "-vframes",
        "1",
        outputPath
    ];
    await runFfmpeg(args);
};

const generatePreview = async (inputPath, outputPath) => {
    await ensureDir(path.dirname(outputPath));
    const scaleFilter = "scale=w=1280:h=720:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2";
    const previewFilter = [
        "scale=w=1280:h=720:force_original_aspect_ratio=decrease",
        "scale=trunc(iw/2)*2:trunc(ih/2)*2",
        "drawtext=text='PREVIEW TRACK':x=(w-tw)/2:y=(h-th)/2:fontsize=36:fontcolor=white@0.25:shadowcolor=black@0.2:shadowx=2:shadowy=2"
    ].join(",");

    const args = [
        "-y",
        "-i",
        inputPath,
        "-ss",
        "00:00:00",
        "-t",
        "00:00:08",
        "-vf",
        scaleFilter,
        "-c:v",
        "h264",
        "-c:a",
        "aac",
        outputPath
    ];
    await runFfmpeg(args);
};

const getContentType = (fileName) => {
    if (fileName.endsWith(".m3u8")) {
        return "application/vnd.apple.mpegurl";
    }
    if (fileName.endsWith(".ts")) {
        return "video/MP2T";
    }
    return "application/octet-stream";
};

const uploadDirectoryToS3 = async (bucket, outputDir, outputPrefix) => {
    const fileNames = await fs.readdir(outputDir);
    const uploadedKeys = [];

    for (const fileName of fileNames) {
        const filePath = path.join(outputDir, fileName);
        const key = `${outputPrefix}/${fileName}`;
        const body = createReadStream(filePath);
        const contentType = getContentType(fileName);

        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body,
                ContentType: contentType
            })
        );

        uploadedKeys.push(key);
    }

    return uploadedKeys;
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

const ensureDlq = async (channel) => {
    await channel.assertQueue(DLQ_QUEUE, { durable: true });
    await channel.bindQueue(DLQ_QUEUE, rabbitConfig.exchange, ROUTING_KEY_DLQ);
};

const startWorker = async () => {
    const channel = await getRabbitChannel();

    await ensureDlq(channel);
    await channel.assertQueue(UPLOADED_QUEUE, queueOptions);
    await channel.bindQueue(UPLOADED_QUEUE, rabbitConfig.exchange, ROUTING_KEY_UPLOADED);
    channel.prefetch(1);

    channel.consume(UPLOADED_QUEUE, async (msg) => {
        if (!msg) {
            return;
        }

        let baseDir = null;
        try {
            console.log("Received video.uploaded message");
            const content = JSON.parse(msg.content.toString());
            const { payload } = content;
            const { fileId, s3Key } = payload;

            console.log(`Processing fileId=${fileId} s3Key=${s3Key}`);

            if (!s3Key) {
                throw new Error("Missing s3Key in payload");
            }

            await publishEvent("video.processing", {
                fileId,
                startedAt: new Date().toISOString()
            });
            console.log(`Published video.processing for fileId=${fileId}`);

            baseDir = path.join(os.tmpdir(), "transcodes", fileId);
            const fileExtension = path.extname(s3Key) || ".mp4";
            const inputPath = path.join(baseDir, `source${fileExtension}`); // Keeps container profiles valid for FFmpeg!

            const outputDir = path.join(baseDir, "hls");
            const mp4Dir = path.join(baseDir, "mp4");

            await downloadFromS3(process.env.S3_BUCKET_NAME, s3Key, inputPath);
            console.log("Downloaded source from S3");
            await transcodeToHls(inputPath, outputDir);
            console.log("HLS renditions generated");

            await transcodeToMp4Renditions(inputPath, mp4Dir);
            console.log("MP4 renditions generated");

            const assetsDir = path.join(baseDir, "assets");
            const thumbnailPath = path.join(assetsDir, "thumbnail.jpg");
            const previewPath = path.join(assetsDir, "preview.mp4");

            await generateThumbnail(inputPath, thumbnailPath);
            console.log("Thumbnail generated");
            await generatePreview(inputPath, previewPath);
            console.log("Preview clip generated");

            const outputPrefix = `hls/${fileId}`;
            const uploadedKeys = await uploadDirectoryToS3(process.env.S3_BUCKET_NAME, outputDir, outputPrefix);
            console.log("Uploaded HLS outputs to S3");

            const mp4Prefix = `mp4/${fileId}`;
            const uploadedMp4Keys = await uploadDirectoryToS3(process.env.S3_BUCKET_NAME, mp4Dir, mp4Prefix);
            console.log("Uploaded MP4 outputs to S3");

            const thumbnailKey = `assets/${fileId}/thumbnail.jpg`;
            const previewKey = `assets/${fileId}/preview.mp4`;

            await uploadFileToS3(process.env.S3_BUCKET_NAME, thumbnailPath, thumbnailKey, "image/jpeg");
            console.log("Uploaded thumbnail to S3");
            await uploadFileToS3(process.env.S3_BUCKET_NAME, previewPath, previewKey, "video/mp4");
            console.log("Uploaded preview to S3");

            const renditionKeys = renditions.map((rendition) => ({
                name: rendition.name,
                playlistKey: `${outputPrefix}/${rendition.name}.m3u8`,
                resolution: `${rendition.width}x${rendition.height}`
            }));

            const mp4RenditionKeys = renditions.map((rendition) => ({
                name: rendition.name,
                mp4Key: `${mp4Prefix}/${rendition.name}.mp4`,
                resolution: `${rendition.width}x${rendition.height}`
            }));

            await publishEvent("video.transcoded", {
                fileId,
                renditions: renditionKeys,
                mp4Renditions: mp4RenditionKeys,
                masterKey: `${outputPrefix}/master.m3u8`,
                thumbnailKey,
                previewKey,
                completedAt: new Date().toISOString(),
                outputKeys: uploadedKeys,
                mp4OutputKeys: uploadedMp4Keys
            });
            console.log(`Published video.transcoded for fileId=${fileId}`);

            channel.ack(msg);
        } catch (error) {
            console.error("Worker failed to process video.uploaded:", error);

            try {
                const content = msg ? JSON.parse(msg.content.toString()) : null;
                const fileId = content?.payload?.fileId;
                await publishEvent("video.failed", {
                    fileId,
                    errorMessage: error.message,
                    failedAt: new Date().toISOString()
                });
            } catch (publishError) {
                console.error("Failed to publish video.failed event:", publishError);
            }

            channel.nack(msg, false, false);
        } finally {
            if (baseDir) {
                await fs.rm(baseDir, { recursive: true, force: true });
            }
        }
    });

    console.log("Worker is waiting for video.uploaded events...");
};

startWorker().catch((error) => {
    console.error("Worker failed to start:", error);
    process.exit(1);
});
