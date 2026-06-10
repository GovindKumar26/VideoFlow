import express from "express";
import { uploadFile, streamUpload } from "../controllers/uploadingController.js";
import upload from "../middlewares/multerMiddlewar.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/", auth, upload.single("file"), uploadFile);
router.post("/stream", auth, streamUpload);

export default router;
