// server/routes/apiInboundRoutes.js
import express from "express";

import { programIngestVideo } from "../controllers/ingestController.js";
import { confirmPassthroughUpload, generatePassthroughUrl } from "../controllers/uploadApiController.js";
import { validateApiKey } from "../middlewares/apiAuth.js";

const router = express.Router();

// 🔒 API-Key Protected endpoint for external system servers
router.post("/v1/media/ingest", validateApiKey, programIngestVideo);
router.post("/v1/uploads/presigned-url", validateApiKey, generatePassthroughUrl);
// server/routes/apiInboundRoutes.js
router.post("/v1/uploads/confirm", validateApiKey, confirmPassthroughUpload);

export default router;