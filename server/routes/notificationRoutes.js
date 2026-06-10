import express from "express";
import auth from "../middlewares/auth.js";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.use(auth);
router.get("/", listNotifications);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);

export default router;
