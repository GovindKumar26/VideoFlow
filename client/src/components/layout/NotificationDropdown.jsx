import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bell, AlertCircle, CheckCircle, Info } from "lucide-react";

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // 📥 Fetch historical notifications on load
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${apiBaseUrl}/notifications`, { withCredentials: true });
                const historicalData = res.data?.notifications || [];
                setNotifications(historicalData);
                // setNotifications(res.data?.notifications || res.data || []);
            } catch (err) {
                console.error("Failed to load historical notification arrays:", err);
            }
        };
        fetchHistory();
    }, [apiBaseUrl]);

    // 📡 Real-time Socket Event Listener
    // Inside your NotificationDropdown.jsx real-time listener useEffect:
    // 🎯 FIXED: src/components/layout/NotificationDropdown.jsx
    useEffect(() => {
        const handleNewSocketEvent = (e) => {
            const freshAlert = {
                ...e.detail,
                isRead: e.detail?.isRead ?? false,
                createdAt: e.detail?.createdAt || new Date().toISOString()
            };
            setNotifications((prev) => [freshAlert, ...prev]);
        };

        // Only add the listener—do NOT dispatch an event here!
        window.addEventListener("new-socket-notification", handleNewSocketEvent);
        return () => window.removeEventListener("new-socket-notification", handleNewSocketEvent);
    }, []);
    // 🎯 MARK AS READ ENGINE
    const handleToggleDropdown = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        // If opening the menu and there are unread notifications, clear them!
        if (nextState && notifications.some(n => !n.isRead)) {
            try {
                // 1. Optimistically update local UI state to clear badges instantly
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

                // 2. Persist the read state to the database
                await axios.patch(`${apiBaseUrl}/notifications/read-all`, {}, { withCredentials: true });
            } catch (err) {
                console.error("Failed to persist notification read state:", err);
            }
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type) => {
        if (type === "success") return <CheckCircle className="h-4 w-4 text-emerald-400" />;
        if (type === "error") return <AlertCircle className="h-4 w-4 text-red-400" />;
        return <Info className="h-4 w-4 text-blue-400" />;
    };

    return (
        <div className="relative">
            {/* 🔔 The Bell Icon Trigger Button */}
            <button
                onClick={handleToggleDropdown}
                className="relative p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors"
            >
                <Bell className="h-5 w-5 text-[#b6c0e0] hover:text-[#eef2ff]" />

                {/* 🎯 Badge and Blink animation will only render if unreadCount > 0 */}
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Card Interface Panel */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-[#273155] bg-[#111833] p-2 shadow-2xl z-50 max-h-[380px] overflow-y-auto space-y-1">
                        <div className="px-3 py-2 border-b border-[#273155]/60 flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-[#eef2ff]">Activity Log</span>
                        </div>

                        {notifications.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground text-center py-8 font-mono text-[#b6c0e0]/60">
                                No recent processing events.
                            </p>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id || n.id || Math.random()}
                                    onClick={() => {
                                        const fileId = n.data?.fileId;
                                        if (fileId) window.location.href = `${apiBaseUrl}/videos/${fileId}`;
                                    }}
                                    className="p-2.5 rounded-lg text-left flex gap-3 hover:bg-white/5 cursor-pointer transition-colors"
                                >
                                    <div className="mt-0.5">{getIcon(n.type)}</div>
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <p className="text-xs font-medium text-[#eef2ff] truncate">{n.title}</p>
                                        <p className="text-[11px] text-[#b6c0e0] leading-tight line-clamp-2">{n.message}</p>
                                        <p className="text-[9px] text-[#b6c0e0]/40 font-mono pt-0.5">
                                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : "Just now"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}