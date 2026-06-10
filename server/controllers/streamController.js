import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3.js";
import File from "../models/File.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const HLS_PREFIX = "hls";
const ASSET_PREFIX = "assets";
const DEFAULT_TTL_SECONDS = 600;
const DEFAULT_STREAM_JWT_TTL_SECONDS = 60;
const DEFAULT_PRESIGN_TTL_SECONDS = 10;

const streamToString = async (stream) => {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf-8");
};

const getContentType = (fileName) => {
    if (fileName.endsWith(".m3u8")) {
        return "application/vnd.apple.mpegurl";
    }
    if (fileName.endsWith(".ts")) {
        return "video/MP2T";
    }
    if (fileName.endsWith(".mp4")) {
        return "video/mp4";
    }
    if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
        return "image/jpeg";
    }
    return "application/octet-stream";
};

const getSignedUrlForKey = async (key, ttlSeconds = DEFAULT_TTL_SECONDS) => {
    const ttl = Number.parseInt(ttlSeconds, 10);
    const expiresIn = Number.isNaN(ttl) ? DEFAULT_TTL_SECONDS : ttl;

    return getSignedUrl(
        s3Client,
        new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key
        }),
        { expiresIn }
    );
};

const verifyStreamToken = (token, fileId) => {
    if (!token) return false;
    try {
        const secret = process.env.STREAM_JWT_SECRET || process.env.JWT_SECRET || "change-me-in-prod";
        const payload = jwt.verify(token, secret);
        return payload.type === "stream" && payload.sub === fileId;
    } catch (error) {
        return false;
    }
};

const rewritePlaylistWithTokenizedUrls = (content, fileId, token) => {
    const basePrefix = `${HLS_PREFIX}/${fileId}/`;
    const lines = content.split(/\r?\n/);
    const rewritten = lines.map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
            return line;
        }
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return line;
        }

        const normalized = trimmed.startsWith(basePrefix)
            ? trimmed.replace(basePrefix, "")
            : trimmed;
        if (normalized.endsWith(".m3u8")) {
            return `/stream/${fileId}/${normalized}?token=${token}`;
        }
        return `/stream/${fileId}/asset/${normalized}?token=${token}`;
    });

    return rewritten.join("\n");
};

// Serve an HLS playlist, validating the stream token and rewriting segment URLs to secured routes.
export const getStreamPlaylist = asyncHandler(async (req, res) => {
    const file = await File.findById(req.params.id);

    if (!file) {
        return res.status(404).json({ message: "File not found" });
    }

    if (file.status !== "transcoded") {
        return res.status(409).json({ message: "File is not ready for playback", status: file.status });
    }

    const token = req.query.token;
    if (!verifyStreamToken(token, file._id.toString())) {
        return res.status(401).json({ message: "Invalid or expired stream token" });
    }

    const playlistName = req.params.playlist || "master.m3u8";
    if (!playlistName.endsWith(".m3u8")) {
        return res.status(404).json({ message: "Playlist not found" });
    }
    const key = playlistName === "master.m3u8" && file.masterKey
        ? file.masterKey
        : `${HLS_PREFIX}/${file._id}/${playlistName}`;

    const response = await s3Client.send(
        new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: key
        })
    );
    const content = await streamToString(response.Body);
    const rewritten = rewritePlaylistWithTokenizedUrls(content, file._id, token);

    res.setHeader("Content-Type", getContentType(playlistName));
    res.status(200).send(rewritten);
});

export const getStreamAsset = asyncHandler(async (req, res) => {
    const { id, asset } = req.params;
    const key = `${HLS_PREFIX}/${id}/${asset}`;
    const token = req.query.token;
    if (!verifyStreamToken(token, id)) {
        return res.status(401).json({ message: "Invalid or expired stream token" });
    }

    const presignTtl = Number.parseInt(process.env.STREAM_PRESIGN_TTL_SECONDS, 10);
    const ttlSeconds = Number.isNaN(presignTtl) ? DEFAULT_PRESIGN_TTL_SECONDS : presignTtl;
    const signedUrl = await getSignedUrlForKey(key, ttlSeconds);

    res.redirect(302, signedUrl);
});

export const getStreamAssetByType = asyncHandler(async (req, res) => {
    const { id, asset } = req.params;
    const key = `${ASSET_PREFIX}/${id}/${asset}`;
    const token = req.query.token;
    if (!verifyStreamToken(token, id)) {
        return res.status(401).json({ message: "Invalid or expired stream token" });
    }

    const presignTtl = Number.parseInt(process.env.STREAM_PRESIGN_TTL_SECONDS, 10);
    const ttlSeconds = Number.isNaN(presignTtl) ? DEFAULT_PRESIGN_TTL_SECONDS : presignTtl;
    const signedUrl = await getSignedUrlForKey(key, ttlSeconds);

    res.redirect(302, signedUrl);
});
