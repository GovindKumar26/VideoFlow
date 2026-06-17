import React, { useState, useEffect } from "react";
import api from "@/axiosApi/axios";
import { ShieldCheck, Clipboard, Trash2, Globe, Calendar, CheckCircle } from "lucide-react";

const WebhookConfig = () => {
    const [url, setUrl] = useState("");
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [msg, setMsg] = useState("");
    const [visibleSecrets, setVisibleSecrets] = useState({}); // Tracks copy/reveal states for individual secrets

    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

    // 📡 Fetch the list of webhooks
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

    // 🚀 Handle New Webhook Creation
    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg("");

        try {
            const payload = { 
                url, 
                events: ["video.transcoded", "video.failed"] 
            };
            
            await api.post(`${apiBaseUrl}/webhooks/`, payload, { withCredentials: true });
            setUrl(""); // Clear input on success
            setMsg("🚀 Webhook channel initialized and registered successfully!");
            await fetchSettings(); // Refresh list automatically
        } catch (err) {
            setMsg("❌ Failed to register new endpoint destination.");
        } finally {
            setLoading(false);
        }
    };

    // 🗑️ Handle Webhook Deletion
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this webhook subscription endpoint?")) return;
        try {
            await api.delete(`${apiBaseUrl}/webhooks/${id}`, { withCredentials: true });
            setMsg("🗑️ Webhook endpoint successfully removed.");
            await fetchSettings();
        } catch (err) {
            setMsg("❌ Failed to delete the target webhook record.");
        }
    };

    const toggleSecretVisibility = (id) => {
        setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (fetching) return <div className="p-6 text-center text-xs font-mono text-muted-foreground">Reading webhook registries...</div>;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {msg && (
                <div className={`p-3 rounded-lg text-xs font-medium border ${msg.startsWith("❌") ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"}`}>
                    {msg}
                </div>
            )}

            {/* Configurator Form Card */}
            <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="text-sm font-semibold mb-1">Add New Event Destination</h3>
                <p className="text-xs text-muted-foreground mb-4">Specify a new backend destination URL endpoint where VideoFlow should broadcast system webhooks.</p>
                
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
            </form>

            {/* 📋 Registered Webhooks List Area */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-tight font-mono text-xs">Active Subscriptions ({webhooks.length})</h4>
                </div>

                {webhooks.length === 0 ? (
                    <div className="text-center p-10 border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                        No active endpoints configured. Register an endpoint above to initialize hooks.
                    </div>
                ) : (
                    webhooks.map((hook) => (
                        <div key={hook._id || hook.id} className="rounded-xl border border-border bg-card/40 overflow-hidden shadow-sm">
                            {/* Main Info Row */}
                            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 bg-card/20">
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2.5">
                                        <Globe className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-sm font-medium text-foreground break-all">{hook.url}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-mono">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {hook.createdAt ? new Date(hook.createdAt).toLocaleDateString() : "N/A"}
                                        </span>
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            Active
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => toggleSecretVisibility(hook._id || hook.id)}
                                        className="px-3 py-1.5 border border-border rounded-md text-xs font-medium hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        {visibleSecrets[hook._id || hook.id] ? "Hide Secret" : "Reveal Secret"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(hook._id || hook.id)}
                                        className="p-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                        title="Delete Endpoint"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Listening Events Badge Strip */}
                            {hook.events && hook.events.length > 0 && (
                                <div className="px-5 py-2.5 bg-background/30 border-b border-border/40 flex flex-wrap items-center gap-2">
                                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground mr-1">Listening to:</span>
                                    {hook.events.map(ev => (
                                        <span key={ev} className="bg-primary/5 text-primary text-[10px] font-mono px-2 py-0.5 rounded border border-primary/10">
                                            {ev}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Dropdown Expandable Signing Secret Block */}
                            {visibleSecrets[hook._id || hook.id] && (
                                <div className="p-5 bg-amber-500/[0.02] border-t border-amber-500/10 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-400/90 font-medium text-xs">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        <span>Endpoint Signing Secret Key</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground max-w-2xl leading-relaxed">
                                        Verify incoming requests payload signatures locally using this specific cryptographic secret to protect your receiver gateway endpoint against replay or spoofing attacks.
                                    </p>
                                    <div className="flex items-center justify-between bg-background px-4 py-2.5 rounded-lg border border-border font-mono text-xs text-amber-300 select-all break-all mt-2 shadow-inner">
                                        <span>{hook.secret}</span>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(hook.secret);
                                                alert("Signing secret safely copied to clipboard!");
                                            }}
                                            className="text-muted-foreground hover:text-foreground p-1 transition-colors ml-3 shrink-0"
                                            title="Copy Key String"
                                        >
                                            <Clipboard className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default WebhookConfig;