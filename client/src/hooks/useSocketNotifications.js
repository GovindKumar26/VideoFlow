// 🎯 UPDATE src/hooks/useSocketNotifications.js
import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";

export const useSocketNotifications = (isAuthenticated) => {
    useEffect(() => {
        // Only establish the connection pipeline if the user is actually logged in
        if (!isAuthenticated) return;

        const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

        const socket = io(apiBaseUrl, {
            withCredentials: true,    // 🔐 CRITICAL: Tells the browser to forward your httpOnly cookies!
            transports: ["websocket"]
        });

        socket.on("connect", () => {
            console.log("📡 Connected to VideoFlow WebSocket server via secure httpOnly cookie lane!");
        });

        socket.on("notification:new", (notification) => {
            console.log("🔥 Notification Received:", notification);
            toast.success(notification.title || "Processing Complete!", {
                description: notification.message
            });

            window.dispatchEvent(new CustomEvent("new-socket-notification", { detail: notification }));
        });



        socket.on("connect_error", (err) => {
            console.error("🔒 Socket handshake rejected:", err.message);
        });

        return () => {
            // 🔍 Only force close if the socket is fully open or currently connecting
            if (socket) {
                console.log("🔌 Cleaning up socket lane...");
                socket.disconnect();
            }
        };
    }, [isAuthenticated]); // Restarts cleanly based on your login boolean state toggle
};