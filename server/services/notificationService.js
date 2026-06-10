import Notification from "../models/notification.js";
import { emitToUser } from "../config/socket.js";

export const createAndEmitNotification = async ({ userId, title, message, type = "info", data = {} }) => {
    if (!userId) {
        return null;
    }

    const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        data
    });

    emitToUser(userId.toString(), "notification:new", {
        id: notification._id,
        user: notification.user,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        isRead: notification.isRead,
        createdAt: notification.createdAt
    });

    return notification;
};
