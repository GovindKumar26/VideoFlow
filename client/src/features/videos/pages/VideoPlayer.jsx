// import { useEffect, useRef, useState } from "react";
// import Hls from "hls.js";
// import { Loader2, AlertCircle } from "lucide-react";
// import api from "@/axiosApi/axios"; // Your custom Axios instance with credentials enabled

// export default function VideoPlayer({ videoId }) {
//   const videoRef = useRef(null);
//   const [streamData, setStreamData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // 1. Fetch the authenticated streaming urls and token from your express route
//   useEffect(() => {
//     async function getPlaybackCredentials() {
//       try {
//         setLoading(true);
//         setError(null);
//         // Hits your router.get("/:id/playback") endpoint cleanly
//         const response = await api.get(`/files/${videoId}/playback`);
//         setStreamData(response.data);
//       } catch (err) {
//         console.error("HLS Token Initialization Error:", err);
//         setError(err.response?.data?.message || "Failed to fetch playback credentials.");
//       } finally {
//         setLoading(false);
//       }
//     }

//     if (videoId) getPlaybackCredentials();
//   }, [videoId]);

//   // 2. Bind the HLS.js engine to the standard video element
//   useEffect(() => {
//     if (!streamData?.playbackUrl || !videoRef.current) return;

//     const video = videoRef.current;
//     const streamUrl = streamData.playbackUrl;
//     let hls = null;

//     // Desktop Chrome, Firefox, Edge etc. need HLS.js to parse the manifest files
//     if (Hls.isSupported()) {
//       hls = new Hls({
//         maxMaxBufferLength: 30, // Caps buffer memory footprint at 30 seconds
//       });

//       hls.loadSource(streamUrl);
//       hls.attachMedia(video);

//       hls.on(Hls.Events.MANIFEST_PARSED, () => {
//         console.log("🎯 HLS Manifest successfully fed to browser MSE player wrapper");
//       });

//       hls.on(Hls.Events.ERROR, (event, data) => {
//         if (data.fatal) {
//           console.error("Fatal HLS streaming engine issue:", data);
//           setError("A structural streaming glitch interrupted playback.");
//         }
//       });
//     } 
//     // Fallback path: Safari and mobile browsers parse .m3u8 natively out-of-the-box
//     else if (video.canPlayType("application/vnd.apple.mpegurl")) {
//       video.src = streamUrl;
//     }

//     // 🧼 Clean up stream buffers and network threads when the user clicks away
//     return () => {
//       if (hls) {
//         hls.destroy();
//       }
//     };
//   }, [streamData]);

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center gap-2 text-muted-foreground">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//         <p className="text-sm font-mono uppercase tracking-wider text-[10px]">Authorizing Stream Link...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex flex-col items-center gap-2 text-destructive max-w-sm text-center p-4">
//         <AlertCircle className="h-6 w-6" />
//         <p className="text-sm font-medium">{error}</p>
//       </div>
//     );
//   }

//   return (
//     <video
//       ref={videoRef}
//       controls
//       playsInline
//       poster={streamData?.thumbnailUrl}
//       className="w-full h-full object-contain bg-black shadow-inner"
//     />
//   );
// }




import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle } from "lucide-react";
import api from "@/axiosApi/axios"; // Your custom Axios instance with credentials enabled

export default function VideoPlayer({ videoId }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null); // Keep a stable reference to the Hls instance across states
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch the initial authenticated streaming URLs and token from your express route
  useEffect(() => {
    async function getPlaybackCredentials() {
      try {
        setLoading(true);
        setError(null);
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

    // Desktop Chrome, Firefox, Edge etc. need HLS.js to parse the manifest files
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 30, // Caps buffer memory footprint at 30 seconds
        
        // 🔄 THE INTERCEPTOR: Fires right before hls.js makes any network request
        xhrSetup: async (xhr, url) => {
          // Only intercept requests going to our secure proxy streaming path
          if (url.includes("/stream/")) {
            try {
              // 1. Silently fetch a fresh playback token payload in the background.
              // (Express reads the main HTTP-only cookie to authorize this automatically!)
              const response = await api.get(`/files/${videoId}/playback`);
              const freshPlaybackUrl = response.data.playbackUrl;
              
              // 2. Extract the fresh token parameter out of the fresh playback URL
              const urlObj = new URL(freshPlaybackUrl);
              const freshToken = urlObj.searchParams.get("token");

              // 3. Clone the pending request URL and inject the fresh unexpired token
              const finalUrl = new URL(url);
              finalUrl.searchParams.set("token", freshToken);
              
              // 4. Overwrite the connection context with the fresh URL right before dispatch
              xhr.open("GET", finalUrl.toString(), true);
            } catch (err) {
              console.error("Token refresh intercept loop failed execution:", err);
            }
          }
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls; // Store reference securely

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("🎯 HLS Manifest successfully fed to browser MSE player wrapper");
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        // Ignore non-fatal issues (like temporary chunk drops that hls.js recovers from automatically)
        if (!data.fatal) return;

        // If it's a structural network error, try to recover the media thread gracefully
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          console.warn("Fatal network glitch detected. Attempting live engine recovery...");
          hls.startLoad();
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          console.warn("Fatal media decoding mismatch. Attempting buffer recovery...");
          hls.recoverMediaError();
        } else {
          console.error("Fatal unrecoverable HLS streaming issue:", data);
          setError("A structural streaming glitch interrupted playback.");
        }
      });
    } 
    // Fallback path: Safari and iOS mobile browsers parse .m3u8 natively out-of-the-box
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      
      // 🍏 Safari Native Workaround:
      // Since Safari handles raw stream processing inside its own closed video wrapper,
      // it doesn't give us a hooks interface like xhrSetup. To handle long pauses in Safari,
      // we hook into the standard play event to pull a fresh URL if it's been idle.
      video.onplay = async () => {
        try {
          const response = await api.get(`/files/${videoId}/playback`);
          // Only update the source if the old URL has likely expired to prevent tracking skips
          const currentUrl = new URL(video.src);
          const freshUrl = new URL(response.data.playbackUrl);
          
          if (currentUrl.searchParams.get("token") !== freshUrl.searchParams.get("token")) {
            const currentTime = video.currentTime; // Bookmark the user's current timestamp position
            video.src = response.data.playbackUrl;
            video.load();
            video.currentTime = currentTime; // Resume right where they left off
            video.play().catch(e => console.error(e));
          }
        } catch (err) {
          console.error("Safari native refresh loop failed:", err);
        }
      };
    }

    // 🧼 Clean up stream buffers and network threads when the component unmounts
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamData, videoId]); // Included videoId in the dependency array for strict parity checking

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