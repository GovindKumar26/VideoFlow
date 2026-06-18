import express from "express";
import { createWebhook, listWebhooks, deleteWebhook, updateWebhook } from "../controllers/webhookController.js";
import auth from "../middlewares/auth.js";
import { listWebhookDeliveries, retryDelivery } from "../controllers/webhookDeliveryController.js";

const router = express.Router();

router.use(auth);
router.post("/", createWebhook);
router.get("/", listWebhooks);
router.delete("/:id", deleteWebhook);
router.get("/:id/deliveries", listWebhookDeliveries);
router.post("/:id/deliveries/:deliveryId/retry", retryDelivery);
router.patch("/:id", updateWebhook); // Registers the PATCH layer

export default router;
