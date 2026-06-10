import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import busboy from "busboy";
import s3Client from "../config/s3.js";
import File from "../models/File.js";
import asyncHandler from "../utils/asyncHandler.js";
import { publishEvent } from "../events/publisher.js";
import jwt from "jsonwebtoken";



const buildWatchUrl = (req, fileId) => {
    return `${req.protocol}://${req.get("host")}/files/${fileId}/watch`;
};

const buildPlaybackUrl = (file) => {
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    const masterKey = file.masterKey || (file.status === "transcoded" ? `hls/${file._id}/master.m3u8` : null);

    return publicBaseUrl && masterKey ? `${publicBaseUrl}/${masterKey}` : null;
};

const getAuthenticatedUserFromCookie = (req) => {
    const token = req.cookies?.token;
    if (!token) return null;

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "change-me-in-prod");
        return { id: payload.sub || payload.id, email: payload.email };
    } catch (error) {
        return null;
    }
};

const createStreamToken = (file) => {
    const secret = process.env.STREAM_JWT_SECRET || process.env.JWT_SECRET || "change-me-in-prod";
    const ttlSeconds = Number.parseInt(process.env.STREAM_JWT_TTL_SECONDS, 10);
    const expiresIn = Number.isNaN(ttlSeconds) ? "300s" : `${ttlSeconds}s`;

    return jwt.sign(
        { sub: file._id.toString(), type: "stream" },
        secret,
        { expiresIn }
    );
};

const createDownloadUrl = async (key) => {
    const ttl = Number.parseInt(process.env.DOWNLOAD_PRESIGN_TTL_SECONDS, 10);
    const expiresIn = Number.isNaN(ttl) ? 300 : ttl;

    return getSignedUrl(
        s3Client,
        new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key
        }),
        { expiresIn }
    );
};

export const uploadFile = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Please upload a file." });
    }

    const uniqueName = `${Date.now()}-${req.file.originalname}`;

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: uniqueName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
    });

    await s3Client.send(command);

    const newFile = new File({
        originalName: req.file.originalname,
        storedName: uniqueName,
        path: uniqueName, // In S3, the path is just the object key
        size: req.file.size,
        mimeType: req.file.mimetype,
        owner: req.user && req.user.id ? req.user.id : undefined,
    });
    await newFile.save();

    await publishEvent("video.uploaded", {
        fileId: newFile._id.toString(),
        s3Key: newFile.storedName,
        originalName: newFile.originalName,
        mimeType: newFile.mimeType,
        size: newFile.size,
        uploadedAt: new Date().toISOString()
    });

    res.status(201).json({
        message: "File uploaded successfully to S3.",
        file: newFile,
    });
});

export const getAllFiles = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const files = await File.find({ owner: req.user.id });
    res.status(200).json({
        message: "Files retrieved successfully",
        files: files
    });
});

export const getFile = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);

    if (!file) {
        return res.status(404).json({
            message: "File not found"
        });
    }

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const playbackUrl = buildPlaybackUrl(file);
    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    const masterKey = file.masterKey || (file.status === "transcoded" ? `hls/${file._id}/master.m3u8` : null);
    const thumbnailUrl = publicBaseUrl && file.thumbnailKey ? `${publicBaseUrl}/${file.thumbnailKey}` : null;
    const previewUrl = publicBaseUrl && file.previewKey ? `${publicBaseUrl}/${file.previewKey}` : null;
    const watchUrl = buildWatchUrl(req, file._id);

    res.status(200).json({
        message: "File retrieved",
        file: {
            id: file._id,
            originalName: file.originalName,
            storedName: file.storedName,
            mimeType: file.mimeType,
            size: file.size,
            path: file.path,
            status: file.status,
            renditions: file.renditions,
            mp4Renditions: file.mp4Renditions,
            processingAt: file.processingAt,
            transcodedAt: file.transcodedAt,
            masterKey: masterKey,
            playbackUrl: playbackUrl,
            watchUrl: watchUrl,
            thumbnailKey: file.thumbnailKey,
            thumbnailUrl: thumbnailUrl,
            previewKey: file.previewKey,
            previewUrl: previewUrl,
            lastError: file.lastError,
            uploadDate: file.uploadDate
        }
    });
});

export const getPlaybackInfo1 = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);

    if (!file) {
        return res.status(404).json({
            message: "File not found"
        });
    }

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    if (file.status !== "transcoded") {
        return res.status(409).json({
            message: "File is not ready for playback",
            status: file.status
        });
    }

    const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
    if (!publicBaseUrl) {
        return res.status(400).json({
            message: "S3_PUBLIC_BASE_URL is not configured"
        });
    }

    const masterKey = file.masterKey || `hls/${file._id}/master.m3u8`;
    const playbackUrl = `${publicBaseUrl}/${masterKey}`;
    const thumbnailUrl = file.thumbnailKey ? `${publicBaseUrl}/${file.thumbnailKey}` : null;
    const previewUrl = file.previewKey ? `${publicBaseUrl}/${file.previewKey}` : null;
    const watchUrl = buildWatchUrl(req, file._id);

    res.status(200).json({
        message: "Playback link ready",
        playbackUrl,
        masterKey,
        watchUrl,
        thumbnailUrl,
        previewUrl
    });
});



export const getPlaybackInfo = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);

    if (!file) {
        return res.status(404).json({ message: "File not found" });
    }

    // 1. Generate the same short-lived stream validation token
    const streamToken = createStreamToken(file);

    // 2. Build the secure proxy endpoint links pointing to your Express server
    const host = req.get("host");
    const protocol = req.protocol;

    const playbackUrl = `${protocol}://${host}/stream/${file._id}/master.m3u8?token=${streamToken}`;
    const thumbnailUrl = file.thumbnailKey
        ? `${protocol}://${host}/stream/assets/${file._id}/${file.thumbnailKey.split("/").pop()}?token=${streamToken}`
        : null;
    const previewUrl = file.previewKey
        ? `${protocol}://${host}/stream/assets/${file._id}/${file.previewKey.split("/").pop()}?token=${streamToken}`
        : null;

    // 3. Send this authorized envelope back to your React app
    res.status(200).json({
        message: "Playback link ready",
        playbackUrl,
        thumbnailUrl,
        previewUrl,
        masterKey: `hls/${file._id}/master.m3u8`
    });
});

export const getWatchPage = asyncHandler(async (req, res) => {
        const file = await File.findById(req.params.id);

        if (!file) {
                return res.status(404).send("File not found");
        }

    const viewer = getAuthenticatedUserFromCookie(req);
    const isOwner = viewer && file.owner && file.owner.toString() === viewer.id;
    const isPublic = file.visibility === "public";
    const isUnlisted = file.visibility === "unlisted";

    if (!isPublic && !isUnlisted && !isOwner) {
        res.status(403).setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send("<h2>Access Denied</h2><p>This video is private. Please login.</p>");
    }

    const streamToken = createStreamToken(file);

    const watchUrl = buildWatchUrl(req, file._id);
    const playbackUrl = `${req.protocol}://${req.get("host")}/stream/${file._id}/master.m3u8?token=${streamToken}`;
    const thumbnailUrl = file.thumbnailKey
        ? `${req.protocol}://${req.get("host")}/stream/assets/${file._id}/${file.thumbnailKey.split("/").pop()}?token=${streamToken}`
        : null;
    const previewUrl = file.previewKey
        ? `${req.protocol}://${req.get("host")}/stream/assets/${file._id}/${file.previewKey.split("/").pop()}?token=${streamToken}`
        : null;

        const escapedTitle = String(file.originalName || "Video")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;");

        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.status(200).send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle}</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; background: #0b1020; color: #eef2ff; }
        .wrap { max-width: 960px; margin: 0 auto; padding: 32px 20px 48px; }
        .card { background: #111833; border: 1px solid #273155; border-radius: 18px; padding: 20px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
        video { width: 100%; max-height: 70vh; background: #000; border-radius: 14px; }
        a { color: #8ab4ff; }
        .meta { display: grid; gap: 10px; margin-top: 16px; font-size: 14px; line-height: 1.5; }
        .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
        .badge { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; background: #1d2a57; }
        .muted { color: #b6c0e0; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <h1 style="margin-top:0">${escapedTitle}</h1>
            <video controls playsinline poster="${thumbnailUrl || ""}" src="${playbackUrl}"></video>
            <div class="row">
                <span class="badge">Status: ${file.status}</span>
                <span class="badge">File ID: ${file._id}</span>
            </div>
            <div class="meta">
                <div><strong>Share link:</strong> <a href="${watchUrl}">${watchUrl}</a></div>
                <div><strong>Playback URL:</strong> <a href="${playbackUrl}">${playbackUrl}</a></div>
                ${previewUrl ? `<div><strong>Preview:</strong> <a href="${previewUrl}">${previewUrl}</a></div>` : ""}
                <div class="muted">This page is the permanent shareable link. The actual media URLs can stay signed or private underneath.</div>
            </div>
        </div>
    </div>
</body>
</html>`);
});

export const retryTranscode = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);

    if (!file) {
        return res.status(404).json({
            message: "File not found"
        });
    }

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    if (file.status !== "failed") {
        return res.status(409).json({
            message: "Only failed files can be retried",
            status: file.status
        });
    }

    file.status = "uploaded";
    file.processingAt = null;
    file.transcodedAt = null;
    file.renditions = [];
    file.masterKey = null;
    file.thumbnailKey = null;
    file.previewKey = null;
    file.lastError = null;
    await file.save();

    await publishEvent("video.uploaded", {
        fileId: file._id.toString(),
        s3Key: file.storedName,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        uploadedAt: new Date().toISOString()
    });

    res.status(202).json({
        message: "Retry queued",
        fileId: file._id
    });
});

export const downloadFile = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) {
        return res.status(404).json({
            message: "File not found"
        });
    }

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file.storedName,
    });

    const { Body, ContentType } = await s3Client.send(command);
    res.setHeader('Content-Type', ContentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    Body.pipe(res);
});

export const deleteFile = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) {
        return res.status(404).json({
            message: "File not found"
        });
    }

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: file.storedName,
    });

    await s3Client.send(command);
    await File.findByIdAndDelete(req.params.id);

    res.status(200).json({
        message: "File deleted successfully from S3"
    });
});

export const streamUpload = asyncHandler(async (req, res) => {
    const bb = busboy({ headers: req.headers });
    req.pipe(bb);

    bb.on("file", (fieldname, file, info) => {
        const { filename, encoding, mimeType } = info;
        const uniqueName = `${Date.now()}-${filename}`;

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: uniqueName,
                Body: file,
                ContentType: mimeType,
            },
        });

        upload.done().then(async (data) => {
            const newFile = new File({
                originalName: filename,
                storedName: uniqueName,
                path: uniqueName,
                mimeType: mimeType,
                owner: req.user && req.user.id ? req.user.id : undefined,
            });
            await newFile.save();

            await publishEvent("video.uploaded", {
                fileId: newFile._id.toString(),
                s3Key: newFile.storedName,
                originalName: newFile.originalName,
                mimeType: newFile.mimeType,
                size: newFile.size,
                uploadedAt: new Date().toISOString()
            });

            res.status(201).json({
                message: 'Streamed file uploaded successfully!',
                file: newFile,
            });
        }).catch((err) => {
            console.error("S3 upload error:", err);
            res.status(500).json({ message: "Failed to upload file to S3." });
        });
    });

    bb.on("error", (err) => {
        console.error("Busboy error:", err);
        res.status(500).json({ message: "Error processing file stream." });
    });

    bb.on("finish", () => {
        // The response is sent when the upload promise resolves,
        // but we can log that busboy is done.
    });
});

export const addSubtitle = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.file) return res.status(400).json({ message: "Please upload a subtitle file" });

    const filename = req.file.originalname;
    const key = `subtitles/${file._id}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
    });

    await s3Client.send(command);

    const entry = { lang: req.body.lang || "und", key, format: (req.body.format || req.file.mimetype) };
    file.subtitles = file.subtitles || [];
    file.subtitles.push(entry);
    await file.save();

    res.status(201).json({ message: "Subtitle uploaded", subtitle: entry });
});

export const downloadRendition = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) {
        return res.status(404).json({ message: "File not found" });
    }

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    if (file.status !== "transcoded") {
        return res.status(409).json({ message: "File is not ready for download", status: file.status });
    }

    const renditionName = req.params.name;
    const rendition = Array.isArray(file.renditions)
        ? file.renditions.find((item) => item.name === renditionName)
        : null;

    if (!rendition || !rendition.playlistKey) {
        return res.status(404).json({ message: "Rendition not found" });
    }

    const downloadUrl = await createDownloadUrl(rendition.playlistKey);

    res.status(200).json({
        message: "Rendition download link ready",
        rendition: {
            name: rendition.name,
            resolution: rendition.resolution,
            playlistKey: rendition.playlistKey
        },
        downloadUrl
    });
});

export const downloadMp4Rendition = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) {
        return res.status(404).json({ message: "File not found" });
    }

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    if (file.status !== "transcoded") {
        return res.status(409).json({ message: "File is not ready for download", status: file.status });
    }

    const renditionName = req.params.name;
    const rendition = Array.isArray(file.mp4Renditions)
        ? file.mp4Renditions.find((item) => item.name === renditionName)
        : null;

    if (!rendition || !rendition.mp4Key) {
        return res.status(404).json({ message: "MP4 rendition not found" });
    }

    const downloadUrl = await createDownloadUrl(rendition.mp4Key);

    res.status(200).json({
        message: "MP4 rendition download link ready",
        rendition: {
            name: rendition.name,
            resolution: rendition.resolution,
            mp4Key: rendition.mp4Key
        },
        downloadUrl
    });
});

export const getPlayerPage = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);

    if (!file) {
        return res.status(404).send("File not found");
    }

    const viewer = getAuthenticatedUserFromCookie(req);
    const isOwner = viewer && file.owner && file.owner.toString() === viewer.id;

    if (!isOwner) {
        res.status(403).setHeader("Content-Type", "text/html; charset=utf-8");
        return res.send("<h2>Access Denied</h2><p>This page is for the owner only.</p>");
    }

    const streamToken = createStreamToken(file);
    const playbackUrl = `${req.protocol}://${req.get("host")}/stream/${file._id}/master.m3u8?token=${streamToken}`;

    const escapedTitle = String(file.originalName || "Video")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapedTitle}</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; background: #0b1020; color: #eef2ff; }
        .wrap { max-width: 960px; margin: 0 auto; padding: 32px 20px 48px; }
        .card { background: #111833; border: 1px solid #273155; border-radius: 18px; padding: 20px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
        video { width: 100%; max-height: 70vh; background: #000; border-radius: 14px; }
        .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin: 16px 0; }
        .badge { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; background: #1d2a57; }
        select { background: #0b1020; color: #eef2ff; border: 1px solid #273155; border-radius: 10px; padding: 6px 10px; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <h1 style="margin-top:0">${escapedTitle}</h1>
            <video id="video" controls playsinline></video>
            <div class="row">
                <span class="badge">Owner playback</span>
                <label for="quality">Quality</label>
                <select id="quality">
                    <option value="auto">Auto</option>
                </select>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
    <script>
        const video = document.getElementById("video");
        const qualitySelect = document.getElementById("quality");
        const sourceUrl = "${playbackUrl}";

        const setQualityOptions = (hls) => {
            const levels = hls.levels || [];
            const current = qualitySelect.value;
            qualitySelect.innerHTML = '<option value="auto">Auto</option>';
            levels.forEach((level, index) => {
                const label = level.height ? (level.height + "p") : ("Level " + (index + 1));
                const option = document.createElement("option");
                option.value = String(index);
                option.textContent = label;
                qualitySelect.appendChild(option);
            });
            if (current !== "auto") {
                qualitySelect.value = current;
            }
        };

        if (window.Hls && Hls.isSupported()) {
            const hls = new Hls({ autoStartLoad: true });
            hls.loadSource(sourceUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => setQualityOptions(hls));
            hls.on(Hls.Events.LEVEL_SWITCHED, () => setQualityOptions(hls));

            qualitySelect.addEventListener("change", (event) => {
                if (event.target.value === "auto") {
                    hls.currentLevel = -1;
                } else {
                    hls.currentLevel = Number(event.target.value);
                }
            });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
        } else {
            qualitySelect.disabled = true;
            qualitySelect.innerHTML = '<option value="auto">HLS not supported</option>';
        }
    </script>
</body>
</html>`);
});





export const updateFileDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { originalName } = req.body;

    // 1. Validation check
    if (!originalName || originalName.trim() === "") {
        return res.status(400).json({ message: "File title cannot be empty" });
    }

    // 2. Find the file and ensure the logged-in user actually owns it
    const file = await File.findOne({ _id: id, owner: req.user.id });

    if (!file) {
        return res.status(404).json({ message: "Video file not found or unauthorized" });
    }

    // 3. Update the field and save
    file.originalName = originalName.trim();
    const updatedFile = await file.save();

    // 4. Return the updated document so Redux can merge it cleanly into the list array cache
    res.status(200).json(updatedFile);
});





export const getDashboardSummary = asyncHandler(async (req, res) => {
    const userId = req.user.id; // Get the logged-in user from auth middleware

    // 1. Run database queries in parallel to keep things blazing fast
    const [totalVideos, analyticsAggregation] = await Promise.all([
        // Count total transcoded videos owned by this user
        File.countDocuments({ owner: userId, status: "transcoded" }),

        // Calculate sums for storage, views, and estimated bandwidth
        File.aggregate([
            { $match: { owner: userId } },
            {
                $group: {
                    _id: null,
                    totalSizeBytes: { $sum: "$size" }, // Assumes your schema uses 'size' in bytes
                    totalViews: { $sum: "$views" },
                }
            }
        ])
    ]);

    // 2. Extract aggregation results safely or default to 0 if the library is empty
    const stats = analyticsAggregation[0] || { totalSizeBytes: 0, totalViews: 0 };

    // 3. Convert raw bytes to clean GB profiles (Bytes / 1024 / 1024 / 1024)
    const storageGb = (stats.totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2);
    
    // For bandwidth, we can simulate a realistic estimate based on viewed data consumption loops
    // (e.g., assuming average view counts consume roughly 1.5x the source file size scale)
    const mockBandwidthBytes = stats.totalSizeBytes * (stats.totalViews * 1.2);
    const bandwidthGb = (mockBandwidthBytes / (1024 * 1024 * 1024)).toFixed(2);

    // 4. Send the dynamic payload straight back to your React client dashboard thunk
    res.status(200).json({
        totalVideos,
        storageGb: parseFloat(storageGb),
        totalViews: stats.totalViews || 0,
        bandwidthGb: parseFloat(bandwidthGb)
    });
});