import React, { useState, useEffect } from "react";
import { Download, Film, Sliders, RefreshCw, CheckCircle, Loader2 } from "lucide-react";
import api from "@/axiosApi/axios";

export default function VideoDownloadsManager({ videoId }) {
    const [activeTab, setActiveTab] = useState("exports"); // "exports" or "initial"
    const [videoData, setVideoData] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        api.get(`/files/${videoId}`)
            .then((res) => {
                if (res.data && res.data.file) {
                    setVideoData(res.data.file)
                } else
                    setVideoData(res.data)
            })

            .catch((err) => console.error("Error loading asset metadata tracking rows:", err));
    }, [videoId, refreshTrigger]);

    const triggerSecureDownload = async (targetIdentifier) => {
        try {
            // 🚀 REUSING: Seamlessly routes straight into your enhanced controller endpoint!
            const response = await api.get(`/files/${videoId}/download/mp4/${encodeURIComponent(targetIdentifier)}`);

            // Allocate system window context thread download target
            window.open(response.data.downloadUrl, "_self");
        } catch (err) {
            const serverMessage = err.response?.data?.message || "Failed to obtain secure object download link.";
            alert(serverMessage);
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card p-6 w-full max-w-4xl">
            {/* Workspace Menu Headers */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("exports")}
                        className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === "exports" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Studio Exports ({videoData?.exports?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab("initial")}
                        className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === "initial" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Initial Renditions ({videoData?.mp4Renditions?.length || 0})
                    </button>
                </div>

                {activeTab === "exports" && (
                    <button
                        onClick={() => setRefreshTrigger(p => p + 1)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded border border-border bg-background transition-colors"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* VIEW A: CUSTOM TIMELINE STUDIO EXPORTS SECTION */}
            {activeTab === "exports" && (
                <div className="space-y-3">
                    {!videoData?.exports || videoData.exports.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-border rounded-lg text-muted-foreground text-xs font-mono">
                            NO PIPELINE STUDIO EXPORTS COMPILED FOR THIS PROJECT YET
                        </div>
                    ) : (
                        videoData.exports.map((exp) => (
                            <div key={exp._id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background hover:border-border/80 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-primary/10 text-primary">
                                        <Sliders className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium">{exp.title}</h4>
                                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                                            Framing Aspect: <span className="text-foreground font-bold">{exp.cropRatio}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Processing State Conditional Renderer Layout Execution */}
                                {exp.status === "processing" ? (
                                    <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest bg-amber-500/5 px-3 py-1.5 rounded border border-amber-500/20">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rendering...
                                    </div>
                                ) : exp.status === "failed" ? (
                                    <div className="text-xs font-mono text-destructive uppercase tracking-widest bg-destructive/5 px-3 py-1.5 rounded border border-destructive/20">
                                        Render Failed
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => triggerSecureDownload(exp._id)}
                                        className="h-9 px-4 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <Download className="h-3.5 w-3.5" /> Download Cut
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* VIEW B: PLATFORM STANDARD INITIAL UPLOAD RESOLUTIONS */}
            {activeTab === "initial" && (
                <div className="space-y-3">
                    {!videoData?.mp4Renditions || videoData.mp4Renditions.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-border rounded-lg text-muted-foreground text-xs font-mono">
                            INITIAL ARCHIVE MP4 RESOLUTIONS GENERATION PENDING
                        </div>
                    ) : (
                        videoData.mp4Renditions.map((rendition, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded bg-secondary text-secondary-foreground">
                                        <Film className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium">{rendition.name || "Default Asset Variant"}</h4>
                                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Spatial Frame Resolution Matrix: {rendition.resolution}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => triggerSecureDownload(rendition.name)}
                                    className="h-9 px-4 rounded bg-secondary hover:bg-secondary/80 text-xs font-medium flex items-center gap-2 transition-colors border border-border"
                                >
                                    <Download className="h-3.5 w-3.5" /> Download ({rendition.resolution.split("x")[1]}p)
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}