// server/routes/developerRoutes.js
import express from "express";
import auth from "../middlewares/auth.js";
import { createApiKey, getApiKeys, revokeApiKey } from "../controllers/apiController.js";


const router = express.Router();

router.get("/api-keys", auth, getApiKeys);
router.post("/api-keys", auth, createApiKey);
router.delete("/api-keys/:id", auth, revokeApiKey);

export default router;