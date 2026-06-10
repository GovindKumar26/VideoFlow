import express from "express";
import { getDlqSummary, requeueDlqMessages, purgeDlq } from "../controllers/dlqController.js";

const router = express.Router();

router.get("/dlq", getDlqSummary);
router.post("/dlq/requeue", requeueDlqMessages);
router.delete("/dlq", purgeDlq);

export default router;
