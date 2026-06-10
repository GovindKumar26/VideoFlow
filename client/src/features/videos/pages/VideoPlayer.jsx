import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle } from "lucide-react";
import api from "@/axiosApi/axios"; // Your custom Axios instance with credentials enabled

export default function VideoPlayer({ videoId }) {
  const videoRef = useRef(null);
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch the authenticated streaming urls and token from your express route
  useEffect(() => {
    async function getPlaybackCredentials() {
      try {
        setLoading(true);
        setError(null);
        // Hits your router.get("/:id/playback") endpoint cleanly
        const response = await api.get(`/files/${videoId}/playback`);
        setStreamData(response.data);
      } catch (err) {
        console.error("HLS Token Initialization Error:", err);
        setError(err.response?.data?.message || "Failed to fetch playback credentials.");
      } finally {
        setLoading(false);
      }
    }

    if (videoId) getPlaybackCredentials();
  }, [videoId]);

  // 2. Bind the HLS.js engine to the standard video element
  useEffect(() => {
    if (!streamData?.playbackUrl || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = streamData.playbackUrl;
    let hls = null;

    // Desktop Chrome, Firefox, Edge etc. need HLS.js to parse the manifest files
    if (Hls.isSupported()) {
      hls = new Hls({
        maxMaxBufferLength: 30, // Caps buffer memory footprint at 30 seconds
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("🎯 HLS Manifest successfully fed to browser MSE player wrapper");
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("Fatal HLS streaming engine issue:", data);
          setError("A structural streaming glitch interrupted playback.");
        }
      });
    } 
    // Fallback path: Safari and mobile browsers parse .m3u8 natively out-of-the-box
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    }

    // 🧼 Clean up stream buffers and network threads when the user clicks away
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-mono uppercase tracking-wider text-[10px]">Authorizing Stream Link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 text-destructive max-w-sm text-center p-4">
        <AlertCircle className="h-6 w-6" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      poster={streamData?.thumbnailUrl}
      className="w-full h-full object-contain bg-black shadow-inner"
    />
  );
}