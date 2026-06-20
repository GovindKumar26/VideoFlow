/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars, react-hooks/exhaustive-deps */

import React, { useState, useEffect } from "react";
import api from "@/axiosApi/axios";
import { AlertTriangle, RefreshCw, Trash2, ShieldAlert, Terminal, Eye, Layers } from "lucide-react";
import { toast } from 'sonner';

const DlqDashboard = () => {
    const [dlqData, setDlqData] = useState({ queue: "video.dlq", total: 0, sampleCount: 0, messages: [] });
    const [fetching, setFetching] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
   // const [msg, setMsg] = useState("");
    const [viewingPayload, setViewingPayload] = useState(null);
    const [sampleLimit, setSampleLimit] = useState(10);

    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const fetchDlqSummary = async () => {
        setFetching(true);
        try {
            const res = await api.get(`${apiBaseUrl}/api/admin/dlq?limit=${sampleLimit}`, { withCredentials: true });
            setDlqData(res.data);
        } catch (err) {
          //  setMsg("❌ Failed to pull system DLQ storage allocations metadata.");
            toast.error("Failed to pull system DLQ storage allocations metadata.");
            
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchDlqSummary();
    }, [sampleLimit]);

    // 🔄 Bulk Requeue Mutation Handoff
    // 🔄 Requeue Action Confirmation
const handleRequeueAll = () => {
    toast.info("Requeue Failed Jobs?", {
        description: "This will re-inject up to 50 poison messages back into active worker tracks.",
        position: "top-center",
        duration: Infinity,
        action: {
            label: "Requeue",
            onClick: async () => {
                setActionLoading(true);
                try {
                    const res = await api.post(`${apiBaseUrl}/api/admin/dlq/requeue?limit=50`, {}, { withCredentials: true });
                    toast.success(`Successfully requeued ${res.data.requeued || 0} messages!`);
                    setViewingPayload(null);
                    await fetchDlqSummary();
                } catch (err) {
                    toast.error("❌ Failed to clear or re-route DLQ transaction tasks.");
                } finally {
                    setActionLoading(false);
                }
            }
        },
        cancel: {
            label: "Cancel",
            onClick: () => toast.dismiss()
        }
    });
};

// 🗑️ Purge Queue Confirmation
const handlePurgeQueue = () => {
    toast.error("CRITICAL ACTION: Purge DLQ?", {
        description: "Are you absolutely sure? This permanently deletes ALL messages in the DLQ.",
        position: "top-center",
        duration: Infinity,
        action: {
            label: "Purge All",
            onClick: async () => {
                setActionLoading(true);
                try {
                    const res = await api.delete(`${apiBaseUrl}/api/admin/dlq`, {}, { withCredentials: true });
                    toast.success(`🗑️ Wiped queue clean. Purged ${res.data.purged || 0} unfixable messages.`);
                    setViewingPayload(null);
                    await fetchDlqSummary();
                } catch (err) {
                    toast.error("❌ Failed to purge target RabbitMQ queue resources.");
                } finally {
                    setActionLoading(false);
                }
            }
        },
        cancel: {
            label: "Cancel",
            onClick: () => toast.dismiss()
        }
    });
};

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12 p-4">
            {/* Header Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-red-400 font-mono text-xs font-semibold uppercase tracking-wider">
                        <ShieldAlert className="h-4 w-4" /> Platform Infrastructure Center
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-foreground mt-1">Dead Letter Queue (DLQ) Manager</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Monitor, inspect, and recover unprocessable or failed message transactions from your system.</p>
                </div>
                
                {/* Global Action Management Arrays Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={fetchDlqSummary}
                        disabled={fetching || actionLoading}
                        className="p-2 border border-border bg-card hover:bg-white/5 rounded-lg text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        title="Refresh Queue States"
                    >
                        <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        onClick={handleRequeueAll}
                        disabled={dlqData.total === 0 || actionLoading || fetching}
                        className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 inline-flex items-center gap-1.5"
                    >
                        <RefreshCw className="h-3.5 w-3.5" /> Requeue Failed Jobs
                    </button>
                    <button
                        onClick={handlePurgeQueue}
                        disabled={dlqData.total === 0 || actionLoading || fetching}
                        className="border border-red-500/20 text-red-400 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-40 inline-flex items-center gap-1.5"
                    >
                        <Trash2 className="h-3.5 w-3.5" /> Purge Queue
                    </button>
                </div>
            </div>

            {/* Banner Notifications feedback log error 
            {msg && (
                <div className={`p-3 rounded-lg text-xs font-medium border ${msg.startsWith("❌") ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"}`}>
                    {msg}
                </div>
            )}
                */}

            {/* Metrics Row Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-card/40 border border-border rounded-xl shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[11px] font-mono text-muted-foreground uppercase font-medium">Target Queue Name</span>
                        <p className="text-sm font-mono font-bold text-foreground">{dlqData.queue}</p>
                    </div>
                    <Layers className="h-5 w-5 text-muted-foreground opacity-60" />
                </div>
                <div className="p-5 bg-card/40 border border-border rounded-xl shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-[11px] font-mono text-muted-foreground uppercase font-medium">Active Dead Records</span>
                        <p className={`text-2xl font-bold font-mono ${dlqData.total > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>
                            {dlqData.total}
                        </p>
                    </div>
                    <AlertTriangle className={`h-5 w-5 ${dlqData.total > 0 ? "text-red-400" : "text-muted-foreground opacity-60"}`} />
                </div>
                <div className="p-5 bg-card/40 border border-border rounded-xl shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-muted-foreground uppercase font-medium">Inspect Sampling Depth</span>
                        <select 
                            value={sampleLimit}
                            onChange={(e) => setSampleLimit(Number(e.target.value))}
                            className="bg-background border border-border text-[11px] rounded px-2 py-0.5 text-foreground focus:outline-none"
                        >
                            <option value={5}>5 Messages</option>
                            <option value={10}>10 Messages</option>
                            <option value={20}>20 Messages</option>
                        </select>
                    </div>
                    <p className="text-xs text-muted-foreground leading-normal">Loaded samples showing detailed internal tracking parameters matrices context.</p>
                </div>
            </div>

            {/* Primary Console Log Interface Split layout columns arrays */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Sample Items List Track */}
                <div className="lg:col-span-7 space-y-3">
                    <h3 className="text-xs font-mono uppercase text-muted-foreground tracking-wider font-semibold border-b border-border pb-1">Poison Message Registry Logs ({dlqData.sampleCount})</h3>
                    
                    {fetching ? (
                        <div className="text-center p-12 text-xs font-mono text-muted-foreground border border-border rounded-xl bg-card/10">Sampling message registries parameters streams...</div>
                    ) : dlqData.messages.length === 0 ? (
                        <div className="text-center p-12 text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card/10 italic">
                            🎉 Beautiful! The Dead Letter Queue is perfectly empty. System pipelines running healthy.
                        </div>
                    ) : (
                        dlqData.messages.map((message, idx) => {
                            const isViewing = viewingPayload?.eventId === message.eventId;
                            return (
                                <div 
                                    key={message.eventId || idx}
                                    className={`p-4 border rounded-xl transition-all bg-card/30 flex items-center justify-between gap-4 ${
                                        isViewing ? "border-red-500/40 bg-red-500/[0.01]" : "border-border hover:border-border/80"
                                    }`}
                                >
                                    <div className="space-y-1 min-w-0 font-mono text-[11px]">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">
                                                {message.routingKey || "video.uploaded"}
                                            </span>
                                            <span className="text-muted-foreground truncate max-w-[180px] sm:max-w-xs" title="Event Tracking Identification Reference">
                                                ID: {message.eventId || "N/A"}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-[10px]">
                                            Crashed At: {message.sentAt ? new Date(message.sentAt).toLocaleString() : "Unknown Time"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setViewingPayload(message)}
                                        className={`p-1.5 rounded-md border text-xs font-medium transition-colors shrink-0 flex items-center gap-1 ${
                                            isViewing 
                                                ? "bg-red-500/20 text-red-300 border-red-500/30" 
                                                : "border-border hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                        }`}
                                    >
                                        <Eye className="h-3.5 w-3.5" /> <span>Inspect</span>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right Column: JSON Object Parser Terminal View */}
                <div className="lg:col-span-5 space-y-3">
                    <h3 className="text-xs font-mono uppercase text-muted-foreground tracking-wider font-semibold border-b border-border pb-1">Live Metadata Inspector</h3>
                    
                    {viewingPayload ? (
                        <div className="border border-border rounded-xl overflow-hidden bg-background shadow-lg flex flex-col">
                            <div className="bg-muted/40 px-4 py-2.5 border-b border-border flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground">
                                <Terminal className="h-4 w-4 text-primary" />
                                <span>Payload Inspector Console</span>
                            </div>
                            <div className="p-4 overflow-auto max-h-[420px] font-mono text-[11px] text-amber-200 bg-black/90 leading-relaxed select-all whitespace-pre-wrap">
                                {JSON.stringify(viewingPayload, null, 4)}
                            </div>
                            <div className="p-3 bg-muted/20 border-t border-border text-[10px] text-muted-foreground text-center">
                                Click anywhere inside the text block code arrays to select the debugging arguments.
                            </div>
                        </div>
                    ) : (
                        <div className="border border-dashed border-border rounded-xl p-10 text-center text-xs text-muted-foreground bg-card/5 italic">
                            Select a failed poison message event from the log stream to read its trace parameters structure.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DlqDashboard;