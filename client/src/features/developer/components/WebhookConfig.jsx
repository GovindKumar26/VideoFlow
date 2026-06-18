import React, { useState, useEffect } from "react";
import api from "@/axiosApi/axios";
import { ShieldCheck, Clipboard, Trash2, Globe, Calendar, CheckCircle, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Edit2, X } from "lucide-react";
import { toast } from "sonner";

const WebhookConfig = () => {
    const [url, setUrl] = useState("");
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
   // const [msg, setMsg] = useState("");
    const [visibleSecrets, setVisibleSecrets] = useState({});
    
    // Log tracking states
    const [logs, setLogs] = useState({}); 
    const [expandedLogs, setExpandedLogs] = useState({}); 
    const [retryingId, setRetryingId] = useState(null);
    const [selectedEvents, setSelectedEvents] = useState(["video.transcoded"]); 

    // 🎯 EDITING TRACK STATE ARRAYS
    const [editingId, setEditingId] = useState(null); // Tracks which webhook is being edited
    const [editUrl, setEditUrl] = useState("");
    const [editEvents, setEditEvents] = useState([]);

    const AVAILABLE_EVENTS = [
        { id: "video.processing", label: "video.processing", desc: "Triggers the moment an ingestion task initializes FFmpeg slicing arrays." },
        { id: "video.transcoded", label: "video.transcoded", desc: "Triggers when all HLS renditions, thumbnails, and master files complete sync to S3." },
        { id: "video.failed", label: "video.failed", desc: "Triggers instantly if a codec fails or processing aborts mid-flight." }
    ];

    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const fetchSettings = async () => {
        try {
            const res = await api.get(`${apiBaseUrl}/webhooks/`, { withCredentials: true });
            const webhookArray = res.data?.webhooks || res.data;
            if (Array.isArray(webhookArray)) {
                setWebhooks(webhookArray);
            }
        } catch (err) {
            console.error("Failed to pull webhook parameters:", err);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [apiBaseUrl]);

    const fetchWebhookLogs = async (webhookId) => {
        try {
            const res = await api.get(`${apiBaseUrl}/webhooks/${webhookId}/deliveries`, { withCredentials: true });
            setLogs(prev => ({ ...prev, [webhookId]: res.data.deliveries || [] }));
        } catch (err) {
            console.error("Failed to fetch delivery logs:", err);
        }
    };

    const toggleLogPanel = (webhookId) => {
        const isOpening = !expandedLogs[webhookId];
        setExpandedLogs(prev => ({ ...prev, [webhookId]: isOpening }));
        if (isOpening) {
            fetchWebhookLogs(webhookId);
        }
    };

    const handleEventToggle = (eventId) => {
        setSelectedEvents(prev => 
            prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
        );
    };

    // 🎯 Toggle events within active editing sub-panels
    const handleEditEventToggle = (eventId) => {
        setEditEvents(prev =>
            prev.includes(eventId) ? prev.filter(e => e !== eventId) : [...prev, eventId]
        );
    };

    // Initialize editing block state fields with existing parameters data values
    const startEditing = (hook) => {
        const hookId = hook._id || hook.id;
        setEditingId(hookId);
        setEditUrl(hook.url);
        setEditEvents(hook.events || []);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditUrl("");
        setEditEvents([]);
    };

    // 🎯 Send the PATCH configurations update payload mutation request
    const handleUpdateSave = async (webhookId) => {
        if (!editUrl) {
           // setMsg("❌ Destination URL string parameter target cannot be empty.");
            toast.error("❌ Destination URL string parameter target cannot be empty.");
            return;
        }
        if (editEvents.length === 0) {
          //  setMsg("❌ You must select at least one core topic event type tracking subscription.");
           toast.error("❌ You must select at least one core topic event type tracking subscription.");
            return;
        }

        try {
            await api.patch(`${apiBaseUrl}/webhooks/${webhookId}`, {
                url: editUrl,
                events: editEvents
            }, { withCredentials: true });
            
           // setMsg("⚙️ Webhook endpoint configurations modified successfully!");
            toast.success("⚙️ Webhook endpoint configurations modified successfully!")
            setEditingId(null);
            await fetchSettings();
        } catch (err) {
          //  setMsg("❌ Failed to commit current update data mutations values.");
            toast.error("❌ Failed to commit current update data mutations values.")
        }
    };

    const handleRetry = async (webhookId, deliveryId) => {
        setRetryingId(deliveryId);
        try {
            await api.post(`${apiBaseUrl}/webhooks/${webhookId}/deliveries/${deliveryId}/retry`, {}, { withCredentials: true });
            // setMsg("🔄 Retry payload successfully queued!");
            toast.success("🔄 Retry payload successfully queued!")
            await fetchWebhookLogs(webhookId);
        } catch (err) {
          //  setMsg("❌ Failed to queue delivery retry execution.");
            toast.error("❌ Failed to queue delivery retry execution.")
        } finally {
            setRetryingId(null);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (selectedEvents.length === 0) {
           // setMsg("❌ You must select at least one system event specification trigger.");
            toast.error("❌ You must select at least one system event specification trigger.")
            return;
        }

        setLoading(true);
      //  setMsg("");
        try {
            const payload = { url, events: selectedEvents };
            await api.post(`${apiBaseUrl}/webhooks/`, payload, { withCredentials: true });
            setUrl("");
            setSelectedEvents(["video.transcoded"]);
           // setMsg("🚀 Webhook channel initialized and registered successfully!");
            toast.success("🚀 Webhook channel initialized and registered successfully!")
            await fetchSettings();
        } catch (err) {
          //  setMsg("❌ Failed to register new endpoint destination.");
              toast.error("❌ Failed to register new endpoint destination.")
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async (id) => {
    // 🎯 Trigger an action toast with custom confirmation buttons
    toast.warning("Delete Webhook Subscription?", {
        description: "This will permanently stop event broadcasts to this endpoint.",
        position: "top-center",
        duration: Infinity, // Keeps it open until the user acts
        action: {
            label: "Delete",
            onClick: async () => {
                try {
                    await api.delete(`${apiBaseUrl}/webhooks/${id}`, { withCredentials: true });
                    toast.success("🗑️ Webhook endpoint successfully removed.");
                    await fetchSettings();
                } catch (err) {
                    toast.error("❌ Failed to delete the target webhook record.");
                }
            }
        },
        cancel: {
            label: "Cancel",
            onClick: () => toast.dismiss()
        }
    });
};

    if (fetching) return <div className="p-6 text-center text-xs font-mono text-muted-foreground">Reading webhook registries...</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            {/*
            {msg && (
                <div className={`p-3 rounded-lg text-xs font-medium border ${msg.startsWith("❌") ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"}`}>
                    {msg}
                </div>
            )}
            */}

            {/* Configurator Form */}
            <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
                <div>
                    <h3 className="text-sm font-semibold mb-1">Add New Event Destination</h3>
                    <p className="text-xs text-muted-foreground">Specify a new backend endpoint destination URL where VideoFlow should broadcast signed event payloads.</p>
                </div>

                <div className="flex gap-3">
                    <input
                        type="url"
                        required
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.yourdomain.com/webhooks/videoflow"
                        className="flex-1 bg-background border border-border px-4 py-2 rounded-lg text-sm text-foreground focus:outline-none focus:border-primary placeholder-muted-foreground"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-primary-foreground text-xs font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                    >
                        {loading ? "Registering..." : "Add Endpoint"}
                    </button>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                    <label className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider font-semibold">Event Topic Subscriptions</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {AVAILABLE_EVENTS.map((evt) => {
                            const isChecked = selectedEvents.includes(evt.id);
                            return (
                                <label 
                                    key={evt.id} 
                                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all select-none block ${
                                        isChecked ? "border-primary/40 bg-primary/[0.02]" : "border-border bg-background/30 hover:bg-white/[0.01]"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleEventToggle(evt.id)}
                                            className="rounded border-border text-primary focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 bg-background cursor-pointer"
                                        />
                                        <span className="text-xs font-mono font-semibold text-foreground">{evt.label}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-normal pl-5.5">{evt.desc}</p>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </form>

            {/* Subscriptions Grid */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-tight font-mono text-xs border-b border-border pb-2">Active Subscriptions ({webhooks.length})</h4>

                {webhooks.length === 0 ? (
                    <div className="text-center p-10 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                        No active endpoints configured. Register an endpoint above to initialize hooks.
                    </div>
                ) : (
                    webhooks.map((hook) => {
                        const hookId = hook._id || hook.id;
                        const isLogsOpen = expandedLogs[hookId];
                        const hookDeliveries = logs[hookId] || [];
                        const isEditing = editingId === hookId;

                        return (
                            <div key={hookId} className="rounded-xl border border-border bg-card/40 overflow-hidden shadow-sm">
                                {/* MAIN RENDER CONDITIONAL PANEL CONDITIONAL LAYOUT */}
                                {isEditing ? (
                                    /* ACTIVE EDITING MODULE PANEL VIEW CONTAINER BLOCK */
                                    <div className="p-5 bg-muted/20 border-b border-border/50 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono uppercase font-semibold text-amber-400">Editing Endpoint Parameters</span>
                                            <button type="button" onClick={cancelEditing} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
                                                <X className="h-3.5 w-3.5" /> Cancel
                                            </button>
                                        </div>
                                        <div className="flex gap-3">
                                            <input
                                                type="url"
                                                value={editUrl}
                                                onChange={(e) => setEditUrl(e.target.value)}
                                                className="flex-1 bg-background border border-border px-3 py-1.5 rounded-lg text-xs text-foreground focus:outline-none focus:border-primary"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateSave(hookId)}
                                                className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors shrink-0"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
                                            {AVAILABLE_EVENTS.map((evt) => {
                                                const isEditChecked = editEvents.includes(evt.id);
                                                return (
                                                    <label key={evt.id} className={`p-2 rounded border text-left cursor-pointer transition-colors block text-[11px] ${isEditChecked ? "border-amber-500/40 bg-amber-500/[0.02]" : "border-border bg-background/40"}`}>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={isEditChecked}
                                                                onChange={() => handleEditEventToggle(evt.id)}
                                                                className="rounded border-border text-amber-500 focus:ring-0 h-3 w-3 bg-background"
                                                            />
                                                            <span className="font-mono text-foreground font-medium">{evt.label}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    /* STANDARD DISPLAY LOG PANEL ROW */
                                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/20 border-b border-border/60">
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex items-center gap-2.5">
                                                <Globe className="h-4 w-4 text-primary shrink-0" />
                                                <span className="text-sm font-medium text-foreground break-all">{hook.url}</span>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                <div className="flex gap-x-3 text-[11px] text-muted-foreground font-mono mr-2">
                                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {hook.createdAt ? new Date(hook.createdAt).toLocaleDateString() : "N/A"}</span>
                                                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Active</span>
                                                </div>
                                                {hook.events?.map((e) => (
                                                    <span key={e} className="bg-muted text-muted-foreground text-[9px] font-mono px-1.5 py-0.5 rounded border border-border/50">
                                                        {e}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => startEditing(hook)}
                                                className="p-1.5 border border-border hover:bg-white/5 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                                title="Edit Endpoint Configs"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setVisibleSecrets(p => ({ ...p, [hookId]: !p[hookId] }))}
                                                className="px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-white/5 text-muted-foreground hover:text-foreground"
                                            >
                                                {visibleSecrets[hookId] ? "Hide Secret" : "Reveal Secret"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleLogPanel(hookId)}
                                                className="px-3 py-1.5 bg-secondary/60 hover:bg-secondary border border-border rounded-md text-xs font-medium flex items-center gap-1 text-foreground"
                                            >
                                                <span>Delivery History</span>
                                                {isLogsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(hookId)}
                                                className="p-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Signing Secret Expandable Guard View */}
                                {visibleSecrets[hookId] && (
                                    <div className="p-5 bg-amber-500/[0.01] border-b border-border/40 space-y-2">
                                        <div className="flex items-center gap-2 text-amber-400/90 font-medium text-xs">
                                            <ShieldCheck className="h-3.5 w-3.5" />
                                            <span>Endpoint Signing Secret Key</span>
                                        </div>
                                        <div className="flex items-center justify-between bg-background px-4 py-2.5 rounded-lg border border-border font-mono text-xs text-amber-300 select-all break-all">
                                            <span>{hook.secret}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => { navigator.clipboard.writeText(hook.secret); toast.success("🔑 Signing secret token safely copied to clipboard!"); }}
                                                className="text-muted-foreground hover:text-foreground ml-3 shrink-0"
                                            >
                                                <Clipboard className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Expandable Live Terminal logs block */}
                                {isLogsOpen && (
                                    <div className="bg-background/40 border-t border-border/50 p-4 font-mono text-xs">
                                        <div className="flex items-center justify-between mb-3 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
                                            <span>Recent Event Activity Stream</span>
                                            <button onClick={() => fetchWebhookLogs(hookId)} className="hover:text-foreground flex items-center gap-1 font-sans capitalize font-normal text-xs">
                                                <RefreshCw className="h-3 w-3" /> Refresh Logs
                                            </button>
                                        </div>

                                        {hookDeliveries.length === 0 ? (
                                            <div className="text-center py-6 text-muted-foreground text-xs italic">
                                                No delivery events recorded for this destination path yet.
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto rounded-lg border border-border bg-background/60">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-border bg-muted/40 text-[10px] text-muted-foreground uppercase tracking-wider">
                                                            <th className="p-3">Status</th>
                                                            <th className="p-3">Event Trigger</th>
                                                            <th className="p-3">Attempts</th>
                                                            <th className="p-3">Timestamp</th>
                                                            <th className="p-3 text-right">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/60">
                                                        {hookDeliveries.map((delivery) => {
                                                            const isSuccess = delivery.status === "success";
                                                            return (
                                                                <tr key={delivery._id} className="hover:bg-white/[0.02] transition-colors text-xs">
                                                                    <td className="p-3 font-semibold">
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wide ${isSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "bg-red-500/10 text-red-400 border border-red-500/10"}`}>
                                                                            {delivery.responseStatus || (isSuccess ? "200" : "FAIL")}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 text-foreground font-medium">{delivery.event}</td>
                                                                    <td className="p-3 text-muted-foreground text-[11px]">Pass #{delivery.attempt || 1}</td>
                                                                    <td className="p-3 text-muted-foreground text-[11px]">
                                                                        {new Date(delivery.createdAt).toLocaleTimeString()}
                                                                    </td>
                                                                    <td className="p-3 text-right">
                                                                        <button
                                                                            type="button"
                                                                            disabled={retryingId === delivery._id}
                                                                            onClick={() => handleRetry(hookId, delivery._id)}
                                                                            className="inline-flex items-center gap-1 px-2.5 py-1 border border-border rounded bg-secondary/40 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                                                                        >
                                                                            <RefreshCw className={`h-3 w-3 ${retryingId === delivery._id ? "animate-spin" : ""}`} />
                                                                            <span>{retryingId === delivery._id ? "Re-firing..." : "Retry"}</span>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default WebhookConfig;