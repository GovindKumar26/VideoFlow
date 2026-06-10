import Notification from "../models/notification.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

    res.status(200).json({ notifications, unreadCount });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read", notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { $set: { isRead: true } });
    res.status(200).json({ message: "All notifications marked as read" });
});
