import express from "express";
import {
	getAllFiles,
	getFile,
	getPlaybackInfo,
	getWatchPage,
	getPlayerPage,
	retryTranscode,
	downloadFile,
	downloadRendition,
	downloadMp4Rendition,
	deleteFile,
	addSubtitle,
	updateFileDetails,
	getPlaybackInfo1,
	getDashboardSummary,
	getEmbedPage
	,
} from "../controllers/uploadingController.js";
import auth from "../middlewares/auth.js";
import upload from "../middlewares/multerMiddlewar.js";
import { exportVideoEdit } from "../controllers/studioController.js";
import { updateFileWhitelist } from "../controllers/streamController.js";
import { generateEmbedSignature } from "../controllers/fileController.js";

const router = express.Router();

router.get("/", auth, getAllFiles);
router.get("/analytics/summary", auth, getDashboardSummary);
router.get("/:id/watch", getWatchPage);
router.get("/:id/embed", getEmbedPage);
router.get("/:id/sign-embed", auth, generateEmbedSignature);
router.get("/:id/player", auth, getPlayerPage);
router.get("/:id/playback", auth, getPlaybackInfo);
/* {
    "message": "Playback link ready",
    "playbackUrl": "http://localhost:9000/uploads/hls/6a1ed3b8b037795f2646a884/master.m3u8" this link will give access denied because bucket is private,
    "masterKey": "hls/6a1ed3b8b037795f2646a884/master.m3u8",
    "watchUrl": "http://localhost:3000/files/6a1ed3b8b037795f2646a884/watch",
    "thumbnailUrl": "http://localhost:9000/uploads/assets/6a1ed3b8b037795f2646a884/thumbnail.jpg",
    "previewUrl": "http://localhost:9000/uploads/assets/6a1ed3b8b037795f2646a884/preview.mp4"
} */

router.post("/:id/retry", auth, retryTranscode);
router.post("/:id/subtitles", auth, upload.single("subtitle"), addSubtitle);
router.get("/download/:id", auth, downloadFile);
router.get("/:id/download/rendition/:name", auth, downloadRendition);
router.get("/:id/download/mp4/:name", auth, downloadMp4Rendition);
router.get("/:id", auth, getFile);
router.delete("/:id", auth, deleteFile);
router.patch("/:id", auth, updateFileDetails);
router.post("/:id/export", auth, exportVideoEdit);
router.put("/:id/whitelist", auth, updateFileWhitelist);

export default router;

