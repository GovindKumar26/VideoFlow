import express from "express";
import { getStreamPlaylist, getStreamAsset, getStreamAssetByType } from "../controllers/streamController.js";

const router = express.Router();

router.get("/:id/master.m3u8", getStreamPlaylist);
router.get("/:id/asset/:asset", getStreamAsset);
router.get("/assets/:id/:asset", getStreamAssetByType);
router.get("/:id/:playlist", getStreamPlaylist);

export default router;
