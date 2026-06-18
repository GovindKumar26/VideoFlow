import express from "express";
import { getDlqSummary, requeueDlqMessages, purgeDlq } from "../controllers/dlqController.js";
import auth, { requireAdmin } from "../middlewares/auth.js";

const router = express.Router();

router.use(auth);
router.use(requireAdmin);

router.get("/dlq", getDlqSummary);
router.post("/dlq/requeue", requeueDlqMessages);
router.delete("/dlq", purgeDlq);

export default router;
