// src/features/upload/components/RecordingDeck.jsx
import React from "react";
import { useScreenRecorder } from "../hooks/useScreenRecorder";
import api from "@/axiosApi/axios";
import { Radio, Square, RefreshCw, UploadCloud } from "lucide-react";
import { toast } from "sonner";

export default function RecordingDeck({ onUploadComplete }) {
    const { 
        isRecording, 
        recordingTime, 
        recordedFile, 
        startRecording, 
        stopRecording, 
        setRecordedFile 
    } = useScreenRecorder();

    // ⏱️ Formats streaming seconds into standard MM:SS clock strings
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");
        return `${mins}:${secs}`;
    };

    const handleHandoffToPipeline = async () => {
        if (!recordedFile) return;

        const uploadToastId = toast.loading("🚀 Encapsulating raw capture stream buffers and initializing VideoFlow worker tracks...");
        
        try {
            // 📦 Pack our binary File object right into conventional multi-part payload forms
            const formData = new FormData();
            formData.append("video", recordedFile);

            const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

            // Directly post the in-memory asset into your optimized ingestion gateway
            const response = await api.post(`${apiBaseUrl}/upload/stream`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true
            });

            toast.success("🎉 Video uploaded successfully! Media workers assigned to HLS ladders.", { id: uploadToastId });
            setRecordedFile(null); // Clear out local space buffers
            if (onUploadComplete) onUploadComplete(response.data);
        } catch (err) {
            console.error("Capture upload pipeline error:", err);
            toast.error("❌ Failed to push recording to distributed ingestion workers.", { id: uploadToastId });
        }
    };

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
            <div>
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
                    Studio Capture Suite
                </h3>
                <p className="text-xs text-muted-foreground">
                    Record your browser viewport window, desktop workspace layouts, or custom tabs natively on-the-fly.
                </p>
            </div>

            {/* Core Recording Screen Engine Conditional Viewport panels */}
            <div className="border border-border/60 rounded-lg p-8 bg-background/50 flex flex-col items-center justify-center text-center min-h-[200px]">
                {isRecording ? (
                    <div className="space-y-4">
                        <div className="text-2xl font-bold font-mono tracking-widest text-red-400 animate-pulse">
                            {formatTime(recordingTime)}
                        </div>
                        <p className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                            🔴 Capturing Live Display Buffer Lanes
                        </p>
                        <button
                            type="button"
                            onClick={stopRecording}
                            className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                            <Square className="h-3.5 w-3.5 fill-red-400" /> Stop Recording
                        </button>
                    </div>
                ) : recordedFile ? (
                    <div className="space-y-4 max-w-md">
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg inline-flex items-center justify-center">
                            <Radio className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-foreground truncate max-w-xs mx-auto">
                                {recordedFile.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                Size: {(recordedFile.size / (1024 * 1024)).toFixed(2)} MB | Container: WebM
                            </p>
                        </div>
                        <div className="flex items-center gap-3 justify-center">
                            <button
                                type="button"
                                onClick={startRecording}
                                className="border border-border hover:bg-white/5 text-muted-foreground hover:text-foreground text-xs font-semibold px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
                            >
                                <RefreshCw className="h-3.5 w-3.5" /> Re-record
                            </button>
                            <button
                                type="button"
                                onClick={handleHandoffToPipeline}
                                className="bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5"
                            >
                                <UploadCloud className="h-3.5 w-3.5" /> Transcode & Publish
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs text-muted-foreground max-w-xs leading-normal">
                            No external software required. Hit start to assign system audio streams and display capture targets.
                        </p>
                        <button
                            type="button"
                            onClick={startRecording}
                            className="bg-primary text-primary-foreground text-xs font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                        >
                            <Radio className="h-3.5 w-3.5" /> Start Capture Session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}