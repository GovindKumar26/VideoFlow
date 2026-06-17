import React, { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

export default function VideoSharingPanel({ videoId }) {
  const [copied, setCopied] = useState(false);

  const apiBaseUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, "");
  
  // Dynamic link that automatically adapts to Localhost, Staging, or Production domains!
  const shareableWatchUrl = `${apiBaseUrl}/files/${videoId}/watch`;
  
  // 🔗 Compiles a pristine sharing link pointing straight to your backend watch route
 // const shareableWatchUrl = `${window.location.protocol}//${window.location.host.replace(":3000", "3000")}/files/${videoId}/watch`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableWatchUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link text to clipboard:", err);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 w-full mt-4">
      <div className="flex flex-col gap-1.5 mb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
            Share Video Link
        </h3>
        <p className="text-[11px] text-muted-foreground">
            Anyone with this secure link can watch online and access compiled MP4 studio downloads.
        </p>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            readOnly
            value={shareableWatchUrl}
            className="h-9 w-full bg-background border border-border rounded pl-3 pr-8 text-xs text-muted-foreground font-mono focus:outline-none select-all"
          />
          <Share2 className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
        </div>
        
        <button
          onClick={handleCopy}
          className="h-9 px-4 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 transition-all active:scale-[0.98]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-400" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </>
          )}
        </button>
      </div>
    </div>
  );
}