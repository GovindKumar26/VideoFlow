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
            uploadDate: file.uploadDate,
            exports: file.exports || [],
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

// export const getWatchPage = asyncHandler(async (req, res) => {
//         const file = await File.findById(req.params.id);

//         if (!file) {
//                 return res.status(404).send("File not found");
//         }

//     const viewer = getAuthenticatedUserFromCookie(req);
//     const isOwner = viewer && file.owner && file.owner.toString() === viewer.id;
//     const isPublic = file.visibility === "public";
//     const isUnlisted = file.visibility === "unlisted";

//     if (!isPublic && !isUnlisted && !isOwner) {
//         res.status(403).setHeader("Content-Type", "text/html; charset=utf-8");
//         return res.send("<h2>Access Denied</h2><p>This video is private. Please login.</p>");
//     }

//     const streamToken = createStreamToken(file);

//     const watchUrl = buildWatchUrl(req, file._id);
//     const playbackUrl = `${req.protocol}://${req.get("host")}/stream/${file._id}/master.m3u8?token=${streamToken}`;
//     const thumbnailUrl = file.thumbnailKey
//         ? `${req.protocol}://${req.get("host")}/stream/assets/${file._id}/${file.thumbnailKey.split("/").pop()}?token=${streamToken}`
//         : null;
//     const previewUrl = file.previewKey
//         ? `${req.protocol}://${req.get("host")}/stream/assets/${file._id}/${file.previewKey.split("/").pop()}?token=${streamToken}`
//         : null;

//         const escapedTitle = String(file.originalName || "Video")
//                 .replaceAll("&", "&amp;")
//                 .replaceAll("<", "&lt;")
//                 .replaceAll(">", "&gt;")
//                 .replaceAll('"', "&quot;");

//         res.setHeader("Content-Type", "text/html; charset=utf-8");
//         res.status(200).send(`<!doctype html>
// <html lang="en">
// <head>
//     <meta charset="utf-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1" />
//     <title>${escapedTitle}</title>
//     <style>
//         body { font-family: system-ui, sans-serif; margin: 0; background: #0b1020; color: #eef2ff; }
//         .wrap { max-width: 960px; margin: 0 auto; padding: 32px 20px 48px; }
//         .card { background: #111833; border: 1px solid #273155; border-radius: 18px; padding: 20px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
//         video { width: 100%; max-height: 70vh; background: #000; border-radius: 14px; }
//         a { color: #8ab4ff; }
//         .meta { display: grid; gap: 10px; margin-top: 16px; font-size: 14px; line-height: 1.5; }
//         .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
//         .badge { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; background: #1d2a57; }
//         .muted { color: #b6c0e0; }
//     </style>
// </head>
// <body>
//     <div class="wrap">
//         <div class="card">
//             <h1 style="margin-top:0">${escapedTitle}</h1>
//             <video controls playsinline poster="${thumbnailUrl || ""}" src="${playbackUrl}"></video>
//             <div class="row">
//                 <span class="badge">Status: ${file.status}</span>
//                 <span class="badge">File ID: ${file._id}</span>
//             </div>
//             <div class="meta">
//                 <div><strong>Share link:</strong> <a href="${watchUrl}">${watchUrl}</a></div>
//                 <div><strong>Playback URL:</strong> <a href="${playbackUrl}">${playbackUrl}</a></div>
//                 ${previewUrl ? `<div><strong>Preview:</strong> <a href="${previewUrl}">${previewUrl}</a></div>` : ""}
//                 <div class="muted">This page is the permanent shareable link. The actual media URLs can stay signed or private underneath.</div>
//             </div>
//         </div>
//     </div>
// </body>
// </html>`);
// });


export const getWatchPage = asyncHandler(async (req, res) => {
    // 🎯 1. Fetch the video document AND populate the owner's information from the Users collection
    const file = await File.findById(req.params.id).populate("owner", "email");

    if (!file) {
        return res.status(404).send("File not found");
    }

    const creatorEmail = file.owner && file.owner.email ? file.owner.email : "VideoFlow Creator";

    // 🕵️‍♂️ Track current live viewer data context safely for forensics
    const viewer = getAuthenticatedUserFromCookie(req);
    const viewerIdentity = viewer ? viewer.email : `Guest (via Share Link)`;

    const formattedDate = new Date().toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' });
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP";

    // 🎯 IFRAME EMBED SECURITY INSPECTOR
// 🎯 IFRAME EMBED SECURITY INSPECTOR
    const referer = req.headers.referer;
    let isDomainAllowed = false;
    let parentDomain = "";
    let parentOrigin = ""; // 🎯 Track the full protocol + host origin configuration context

    if (referer) {
        try {
            const urlObj = new URL(referer);
            parentDomain = urlObj.hostname;
            parentOrigin = urlObj.origin; // e.g., "http://127.0.0.1:5500" or "https://notion.so"

            const isSelf = parentDomain === req.get("host").split(":")[0];
            const isWhitelisted = Array.isArray(file.allowedDomains) && file.allowedDomains.includes(parentDomain);

            if (isSelf || isWhitelisted) {
                isDomainAllowed = true;
            }
        } catch (e) {
            isDomainAllowed = false;
        }
    } else {
        // Direct link accesses (outside iframe context structures) are always verified
        isDomainAllowed = true;
    }

    // 🔒 CONSTRUCT DYNAMIC SECURITY BOUNDARY
    if (!isDomainAllowed) {
        res.status(403).setHeader("Content-Type", "text/html");
        return res.send(`<h2>Embedding Unauthorized</h2><p>The owner of this video has restricted playback on ${parentDomain || 'this domain'}.</p.`);
    }

    // 🎯 FIX: Pass the complete parentOrigin inside the CSP frame-ancestors rule block 
    // This safely satisfies the browser's port enforcement criteria (e.g., 'self' http://127.0.0.1:5500)
    const frameAncestors = parentOrigin ? `'self' ${parentOrigin}` : "'self'";
    res.setHeader("Content-Security-Policy", `frame-ancestors ${frameAncestors};`);

    // 🎯 Set up your streaming token and paths
    const streamToken = createStreamToken(file);
    const watchUrl = buildWatchUrl(req, file._id);
    const host = req.get("host");
    const protocol = req.protocol;

    const playbackUrl = `${protocol}://${host}/stream/${file._id}/master.m3u8?token=${streamToken}`;
    const thumbnailUrl = file.thumbnailKey
        ? `${protocol}://${host}/stream/assets/${file._id}/${file.thumbnailKey.split("/").pop()}?token=${streamToken}`
        : null;
    const previewUrl = file.previewKey
        ? `${protocol}://${host}/stream/assets/${file._id}/${file.previewKey.split("/").pop()}?token=${streamToken}`
        : null;

    // 🎯 ASSEMBLE DOWNLOAD BUTTON ELEMENTS ON THE FLY
    let downloadButtonsHtml = "";

    if (Array.isArray(file.mp4Renditions) && file.status === "transcoded") {
        file.mp4Renditions.forEach((rendition) => {
            const downloadApiUrl = `${protocol}://${host}/files/${file._id}/download/mp4/${encodeURIComponent(rendition.name)}`;
            downloadButtonsHtml += `
                <button onclick="triggerDownload('${downloadApiUrl}')" class="btn-download">
                    💾 Download ${rendition.resolution || rendition.name}
                </button>
            `;
        });
    }

    if (Array.isArray(file.exports)) {
        const completedCuts = file.exports.filter((exp) => exp.status === "completed");
        completedCuts.forEach((cut) => {
            const downloadApiUrl = `${protocol}://${host}/files/${file._id}/download/mp4/${cut._id}`;
            downloadButtonsHtml += `
                <button onclick="triggerDownload('${downloadApiUrl}')" class="btn-download studio-cut">
                    ✂️ Studio Cut: ${cut.title || "Untitled Trim"} (${cut.cropRatio || "16:9"})
                </button>
            `;
        });
    }

    if (!downloadButtonsHtml) {
        downloadButtonsHtml = `<p class="muted" style="font-size: 12px; font-family: monospace;">No download variations available for this track yet.</p>`;
    }

    const escapedTitle = String(file.originalName || "Video")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");

    // 🎯 RESPOND WITH THE UPGRADED HTML SERVING THE SECURE DIAGONAL TEXT MATRIX
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
        .card { background: #111833; border: 1px solid #273155; border-radius: 18px; padding: 24px; box-shadow: 0 24px 80px rgba(0,0,0,.35); }
        
        /* 🎯 BOUNDARY BOX: Holds the player canvas rigidly */
        .video-container { position: relative; width: 100%; max-height: 70vh; border-radius: 14px; overflow: hidden; background: #000; border: 1px solid #273155; }
        video { width: 100%; height: 100%; object-fit: contain; display: block; }
        
        /* 🎯 THE MATRIX CANVAS CONTAINER */
        #watermark-overlay-matrix {
            position: absolute;
            top: -15%;
            left: -15%;
            width: 130%;
            height: 130%;
            display: grid;
            grid-template-columns: repeat(3, 1fr); /* 3 clean columns */
            grid-template-rows: repeat(3, 1fr);    /* 3 clean rows */
            pointer-events: none;
            user-select: none;
            z-index: 10;
            transform: rotate(-15deg); /* Tilted exactly to design spec */
            opacity: 0.14; 
            transition: transform 0.5s ease-in-out;
        }
        
        /* Individual text repeat cells */
        .matrix-cell {
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: monospace;
            font-size: 13px;
            color: #eef2ff;
            white-space: pre-line;
            text-align: center;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.9);
        }

        a { color: #8ab4ff; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .meta { display: grid; gap: 10px; margin-top: 24px; font-size: 14px; line-height: 1.5; border-top: 1px solid #273155; padding-top: 20px; }
        .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
        .badge { display: inline-flex; align-items: center; padding: 6px 10px; border-radius: 999px; background: #1d2a57; font-size: 12px; }
        .muted { color: #b6c0e0; }

        .download-section { margin-top: 24px; }
        .download-title { font-size: 12px; font-weight: 700; text-transform: uppercase; tracking-index: 0.05em; color: #8ab4ff; margin-bottom: 12px; font-family: monospace; }
        .download-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
        .btn-download { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #1d2a57; border: 1px solid #273155; color: #fff; padding: 12px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
        .btn-download:hover { background: #25356c; border-color: #38497f; transform: translateY(-1px); }
        .btn-download.studio-cut { background: #0a3625; border-color: #145239; }
        .btn-download.studio-cut:hover { background: #114c35; border-color: #1b6b4b; }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="card">
            <h1 style="margin-top:0; font-size:24px; font-weight:600;">${escapedTitle}</h1>
            
            <div class="video-container">
                <div id="watermark-overlay-matrix"></div>
                <video id="video" controls playsinline poster="${thumbnailUrl || ""}"></video>
            </div>
            
            <div class="download-section">
                <div class="download-title">Available Downloads</div>
                <div class="download-grid">
                    ${downloadButtonsHtml}
                </div>
            </div>

            <div class="row">
                <span class="badge">Status: ${file.status}</span>
                <span class="badge">File ID: ${file._id}</span>
            </div>
            
            <div class="meta">
                <div><strong>Share link:</strong> <a href="${watchUrl}">${watchUrl}</a></div>
                <div><strong>Playback URL:</strong> <a href="${playbackUrl}">${playbackUrl}</a></div>
                ${previewUrl ? `<div><strong>Preview:</strong> <a href="${previewUrl}">${previewUrl}</a></div>` : ""}
                <div class="muted" style="font-size:12px; margin-top:4px;">This page is the permanent shareable link. The actual media URLs can stay signed or private underneath.</div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
    <script>
        const video = document.getElementById("video");
        const sourceUrl = "${playbackUrl}";

        if (window.Hls && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(sourceUrl);
            hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
        }

        // 🎯 POPULATE DYNAMIC BACKGROUND MATRIX
        const matrixContainer = document.getElementById("watermark-overlay-matrix");
        
        // Compile identity string
        const identityText = "Viewer: ${viewerIdentity}\\nIP: ${clientIp}";

        // Inject 9 repeating forensic matrix cell points (3x3 grid layout map)
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.className = "matrix-cell";
            cell.innerText = identityText;
            matrixContainer.appendChild(cell);
        }

        // 🎯 THE MATRIX JITTER ROUTINE: Shifts coordinates slightly to confuse fixed-area masking software
        function positionJitterMatrix() {
            const shiftX = Math.floor(Math.random() * 24) - 12; // Jitter boundary: -12px to +12px
            const shiftY = Math.floor(Math.random() * 24) - 12;
            matrixContainer.style.transform = \`rotate(-15deg) translate(\${shiftX}px, \${shiftY}px)\`;
        }
        
        // Fire initialization position, then shuffle bounds every 6 seconds
        positionJitterMatrix();
        setInterval(positionJitterMatrix, 6000);

        const container = document.querySelector(".video-container");
        // 🛡️ DOM TAMPERING INSPECTION WATCHDOG
        const observer = new MutationObserver(() => {
            const matrixCheck = document.getElementById("watermark-overlay-matrix");
            if (!matrixCheck || parseFloat(window.getComputedStyle(matrixCheck).opacity) < 0.05) {
                video.pause();
                alert("Security policy violation detected.");
                window.location.reload();
            }
        });
        observer.observe(container, { attributes: true, childList: true, subtree: true });

        async function triggerDownload(apiUrl) {
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error("Asset unavailable");
                const data = await response.json();
                
                if (data.downloadUrl) {
                    window.location.href = data.downloadUrl;
                } else {
                    alert("Unable to compile download asset link.");
                }
            } catch (err) {
                alert("Failed to securely fetch video download.");
            }
        }
    </script>
</body>
</html>`);
});


// server/controllers/watchController.js

import crypto from "crypto";

export const getEmbedPage = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) {
        return res.status(404).send("File not found");
    }

    // 🕵️‍♂️ Track current live viewer data context safely for forensics
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP";

    // 🎯 QUERY FLAG & CRYPTOGRAPHIC SIGNATURE PASSPORT INSPECTION
    const { viewer, sig } = req.query;
    let viewerIdentity = "Guest (via Embed Frame)";

    if (viewer && sig) {
        const secret = process.env.JWT_SECRET || "change-me-in-prod";
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${file._id}-${viewer.toLowerCase().trim()}`)
            .digest("hex");

        if (sig === expectedSignature) {
            // ✅ Cryptographic verification passes completely
            viewerIdentity = viewer.toLowerCase().trim();
        } else {
            // ❌ Tamper warning: URL modified without signature matching
            viewerIdentity = "⚠️ UNVERIFIED TAMPER DETECTED";
        }
    }

    // 🎯 IFRAME EMBED SECURITY INSPECTOR (REFERER ORIGIN VALIDATION)
    const referer = req.headers.referer;
    let isDomainAllowed = false;
    let parentOrigin = "";
    let parentDomain = "";

    if (referer) {
        try {
            const urlObj = new URL(referer);
            parentOrigin = urlObj.origin;      // e.g., "http://127.0.0.1:5500" or "https://notion.so"
            parentDomain = urlObj.hostname;    // e.g., "127.0.0.1" or "notion.so"

            const isSelf = parentDomain === req.get("host").split(":")[0];
            const isWhitelisted = Array.isArray(file.allowedDomains) && file.allowedDomains.includes(parentDomain);

            if (isSelf || isWhitelisted) {
                isDomainAllowed = true;
            }
        } catch (e) {
            isDomainAllowed = false;
        }
    } else {
        // Prevent raw direct link browser tab execution — this view must live inside an authorized frame shell
        isDomainAllowed = false; 
    }

    // 🔒 CONSTRUCT DYNAMIC SECURITY BOUNDARY
    if (!isDomainAllowed) {
        res.status(403).setHeader("Content-Type", "text/html");
        return res.send(`
            <body style="background:#000;color:#ff4a4a;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;margin:0;text-align:center;padding:20px;">
                <h3 style="margin:0 0 8px 0; font-size: 20px;">Embedding Unauthorized</h3>
                <p style="color:#8592b0; font-size:14px; margin:0;">Playback is restricted on this host domain resource.</p>
            </body>
        `);
    }

    // 🛡️ Pass full origin context to satisfy browser strict port criteria
    const frameAncestors = parentOrigin ? `'self' ${parentOrigin}` : "'self'";
    res.setHeader("Content-Security-Policy", `frame-ancestors ${frameAncestors};`);

    // 🎯 Assemble short-lived token stream assets paths
    const streamToken = createStreamToken(file); // Utilizing your internal token engine signature helper
    const host = req.get("host");
    const protocol = req.protocol;
    
    const playbackUrl = `${protocol}://${host}/stream/${file._id}/master.m3u8?token=${streamToken}`;
    const thumbnailUrl = file.thumbnailKey 
        ? `${protocol}://${host}/stream/assets/${file._id}/${file.thumbnailKey.split("/").pop()}?token=${streamToken}` 
        : null;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VideoFlow Player</title>
    <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
        
        /* 🎯 STABLE BOUNDARY CONTAINER */
        .video-container { position: relative; width: 100%; height: 100vh; background: #000; }
        
        /* 🎯 LOWER OPAQUE PLAYER CANVAS LAYER */
        video { width: 100%; height: 100%; object-fit: contain; display: block; position: relative; z-index: 1; }
        
        /* 🎯 ELEVATED WATERMARK OVERLAY MATRIX (HIGHER Z-INDEX) */
        #watermark-overlay-matrix {
            position: absolute; 
            top: -15%; 
            left: -15%; 
            width: 130%; 
            height: 130%;
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            grid-template-rows: repeat(3, 1fr);
            z-index: 10; 
            transform: rotate(-15deg);
            opacity: 0.14; 
            transition: transform 0.5s ease-in-out;
            
            /* 🚀 THE CRITICAL PASSTHROUGH SHORTCUTS: Bleeds mouse events directly down to native elements */
            pointer-events: none; 
            user-select: none; 
        }
        
        .matrix-cell { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            font-family: monospace; 
            font-size: 13px; 
            color: #eef2ff; 
            text-align: center; 
            text-shadow: 1px 1px 3px rgba(0,0,0,0.9); 
        }
    </style>
</head>
<body>
    <div class="video-container">
        <div id="watermark-overlay-matrix"></div>
        <video id="video" controls playsinline controlsList="nodownload" poster="${thumbnailUrl || ""}"></video>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
    <script>
        const video = document.getElementById("video");
        const sourceUrl = "${playbackUrl}";

        // Initialize Native or fallback HLS Engine pipeline
        if (window.Hls && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(sourceUrl);
            hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = sourceUrl;
        }

        // Populate forensic matrix configuration cell structures
        const matrixContainer = document.getElementById("watermark-overlay-matrix");
        const identityText = "Viewer: ${viewerIdentity}\\nIP: ${clientIp}";

        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.className = "matrix-cell";
            cell.innerText = identityText;
            matrixContainer.appendChild(cell);
        }

        // 🔀 Shifting animation loop calculation block
        function positionJitterMatrix() {
            const shiftX = Math.floor(Math.random() * 24) - 12; // Boundaries shift range mapping: -12px to +12px
            const shiftY = Math.floor(Math.random() * 24) - 12;
            matrixContainer.style.transform = \`rotate(-15deg) translate(\${shiftX}px, \${shiftY}px)\`;
        }
        positionJitterMatrix();
        setInterval(positionJitterMatrix, 6000);

        // 🛡️ SECURITY WATCHDOG MUTATION WATCHER
        const observer = new MutationObserver(() => {
            const matrixCheck = document.getElementById("watermark-overlay-matrix");
            // Check if element was ripped from DOM trees or obfuscated visually via styles
            if (!matrixCheck || parseFloat(window.getComputedStyle(matrixCheck).opacity) < 0.05) {
                video.pause();
                window.location.reload();
            }
        });
        observer.observe(document.querySelector(".video-container"), { attributes: true, childList: true, subtree: true });
    </script>
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

// export const downloadMp4Rendition = asyncHandler(async (req, res) => {
//     const file = await File.findById(req.params.id);
//     if (!file) {
//         return res.status(404).json({ message: "File not found" });
//     }

//     if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
//         return res.status(403).json({ message: "Forbidden" });
//     }

//     if (file.status !== "transcoded") {
//         return res.status(409).json({ message: "File is not ready for download", status: file.status });
//     }

//     const renditionName = req.params.name;
//     const rendition = Array.isArray(file.mp4Renditions)
//         ? file.mp4Renditions.find((item) => item.name === renditionName)
//         : null;

//     if (!rendition || !rendition.mp4Key) {
//         return res.status(404).json({ message: "MP4 rendition not found" });
//     }

//     const downloadUrl = await createDownloadUrl(rendition.mp4Key);

//     res.status(200).json({
//         message: "MP4 rendition download link ready",
//         rendition: {
//             name: rendition.name,
//             resolution: rendition.resolution,
//             mp4Key: rendition.mp4Key
//         },
//         downloadUrl
//     });
// });



export const downloadMp4Rendition = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);
    if (!file) {
        return res.status(404).json({ message: "File not found" });
    }

    if (!req.user || !req.user.id || (file.owner && file.owner.toString() !== req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const targetNameOrId = req.params.name;
    let targetKey = null;
    let responseMetadata = null;

    // 🎯 1. TRY RUNNING STANDARD BASE RESOLUTION LOOKUP FIRST
    const standardRendition = Array.isArray(file.mp4Renditions)
        ? file.mp4Renditions.find((item) => item.name === targetNameOrId || item.resolution === targetNameOrId)
        : null;

    if (standardRendition) {
        // Enforce the transcoded validation guard block strictly for base archival layers
        if (file.status !== "transcoded") {
            return res.status(409).json({ message: "Base file asset is not ready for download", status: file.status });
        }
        targetKey = standardRendition.mp4Key;
        responseMetadata = {
            name: standardRendition.name,
            resolution: standardRendition.resolution,
            mp4Key: standardRendition.mp4Key
        };
    } else {
        // 🎯 2. FALLBACK SUB-DOCUMENT TRACK LOOKUP: Check if param matches a specific custom Studio Export ID
        const studioCut = Array.isArray(file.exports)
            ? file.exports.find((item) => item._id.toString() === targetNameOrId)
            : null;

        if (studioCut) {
            if (studioCut.status !== "completed") {
                return res.status(409).json({ message: "Studio clip rendering pipeline is not finished yet", status: studioCut.status });
            }
            targetKey = studioCut.masterKey;
            responseMetadata = {
                id: studioCut._id,
                title: studioCut.title,
                cropRatio: studioCut.cropRatio,
                mp4Key: studioCut.masterKey
            };
        }
    }

    // Drop an absolute block if neither system tracks locate a match
    if (!targetKey) {
        return res.status(404).json({ message: "Requested video variation variation or studio cut not found" });
    }

    // 🎯 REUSED: Leverage your pre-existing, native presigned helper module seamlessly
    const downloadUrl = await createDownloadUrl(targetKey);

    res.status(200).json({
        message: "MP4 rendition download link ready",
        rendition: responseMetadata,
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




