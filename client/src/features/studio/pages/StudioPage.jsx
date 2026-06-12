// import { Link, useNavigate, useParams } from "react-router-dom";
// import { useEffect, useState } from "react";
// import {
//   ArrowLeft,
//   Scissors,
//   Crop,
//   Subtitles,
//   Download,
//   Play,
// } from "lucide-react";
// import AppShell from "@/components/layout/AppShell";

// const TABS = [
//   {
//     id: "trim",
//     label: "Trim",
//     icon: Scissors,
//   },
//   {
//     id: "crop",
//     label: "Crop",
//     icon: Crop,
//   },
//   {
//     id: "subtitles",
//     label: "Subtitles",
//     icon: Subtitles,
//   },
// ];

// function StudioPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [activeTab, setActiveTab] = useState("trim");

//   const [trimStart, setTrimStart] = useState("00:00");
//   const [trimEnd, setTrimEnd] = useState("04:12");

//   const [aspectRatio, setAspectRatio] = useState("16:9");

//   const [subtitles, setSubtitles] = useState("");

//   const video = {
//     id,
//     title: "Product Demo",
//     duration: "04:12",
//   };

//   useEffect(() => {
//     if (!id) {
//       navigate("/videos");
//     }
//   }, [id, navigate]);

//   return (
//     <AppShell >
//     <div className="min-h-screen bg-background text-foreground">
//       {/* Header */}
//       <header className="border-b border-border">
//         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
//           <Link
//             to="/dashboard"
//             className="font-display text-2xl tracking-tighter uppercase text-primary"
//           >
//             Videoflow
//           </Link>

//           <button
//             className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
//           >
//             <Download className="h-4 w-4" />
//             Export
//           </button>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-6 py-10">
//         {/* Back */}
//         <Link
//           to={`/videos/${video.id}`}
//           className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Back to Video
//         </Link>

//         {/* Title */}
//         <div className="mb-8">
//           <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
//             Video Studio
//           </p>

//           <h1 className="font-display text-4xl uppercase tracking-tight">
//             {video.title}
//           </h1>
//         </div>

//         {/* Preview */}
//         <div className="aspect-video rounded-xl border border-border bg-gradient-to-br from-primary/20 via-white/[0.03] to-transparent flex items-center justify-center mb-8">
//           <div className="text-center">
//             <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
//               <Play className="h-6 w-6" />
//             </div>

//             <p className="text-sm text-muted-foreground">
//               Editor Preview
//             </p>
//           </div>
//         </div>

//         {/* Timeline */}
//         <div className="rounded-xl border border-border bg-card p-5 mb-8">
//           <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground mb-3">
//             <span>Timeline</span>
//             <span>{video.duration}</span>
//           </div>

//           <div className="h-16 rounded-lg bg-white/[0.04] relative overflow-hidden">
//             <div className="absolute inset-y-0 left-[10%] right-[15%] bg-primary/30 border-x-2 border-primary" />

//             <div className="absolute inset-0 flex items-center gap-1 px-2">
//               {Array.from({ length: 40 }).map((_, index) => (
//                 <div
//                   key={index}
//                   className="flex-1 h-8 rounded-sm bg-white/10"
//                 />
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Layout */}
//         <div className="grid lg:grid-cols-[220px_1fr] gap-6">
//           {/* Sidebar */}
//           <div className="flex lg:flex-col gap-2">
//             {TABS.map((tab) => {
//               const Icon = tab.icon;

//               return (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors ${
//                     activeTab === tab.id
//                       ? "bg-primary/10 text-primary"
//                       : "hover:bg-white/[0.03] text-muted-foreground"
//                   }`}
//                 >
//                   <Icon className="h-4 w-4" />
//                   {tab.label}
//                 </button>
//               );
//             })}
//           </div>

//           {/* Panel */}
//           <div className="rounded-xl border border-border bg-card p-6">
//             {activeTab === "trim" && (
//               <div className="space-y-5 max-w-md">
//                 <h2 className="font-display text-2xl uppercase">
//                   Trim Video
//                 </h2>

//                 <div>
//                   <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
//                     Start Time
//                   </label>

//                   <input
//                     value={trimStart}
//                     onChange={(e) => setTrimStart(e.target.value)}
//                     className="w-full h-11 px-4 rounded-lg border border-border bg-background"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
//                     End Time
//                   </label>

//                   <input
//                     value={trimEnd}
//                     onChange={(e) => setTrimEnd(e.target.value)}
//                     className="w-full h-11 px-4 rounded-lg border border-border bg-background"
//                   />
//                 </div>
//               </div>
//             )}

//             {activeTab === "crop" && (
//               <div>
//                 <h2 className="font-display text-2xl uppercase mb-5">
//                   Crop Video
//                 </h2>

//                 <div className="flex flex-wrap gap-3">
//                   {["16:9", "9:16", "1:1", "4:3"].map((ratio) => (
//                     <button
//                       key={ratio}
//                       onClick={() => setAspectRatio(ratio)}
//                       className={`px-4 py-2 rounded-lg border transition-colors ${
//                         aspectRatio === ratio
//                           ? "border-primary text-primary bg-primary/10"
//                           : "border-border"
//                       }`}
//                     >
//                       {ratio}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {activeTab === "subtitles" && (
//               <div>
//                 <h2 className="font-display text-2xl uppercase mb-5">
//                   Subtitles
//                 </h2>

//                 <textarea
//                   rows={10}
//                   value={subtitles}
//                   onChange={(e) => setSubtitles(e.target.value)}
//                   placeholder={`00:00 Welcome to the video

// 00:05 Today we are covering...`}
//                   className="w-full rounded-lg border border-border bg-background p-4"
//                 />

//                 <button className="mt-4 px-4 py-2 rounded-lg border border-border hover:bg-white/[0.03]">
//                   Auto Generate
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </main>
//     </div>
//     </AppShell >
//   );
// }

// export default StudioPage;


import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Hls from "hls.js"; //  Import HLS engine
import {
  ArrowLeft,
  Scissors,
  Crop,
  Subtitles,
  Download,
  Play,
  Pause,
  Loader2,
  AlertCircle
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import api from "@/axiosApi/axios"; // Your secure Axios instance

const TABS = [
  { id: "trim", label: "Trim", icon: Scissors },
  { id: "crop", label: "Crop", icon: Crop },
  { id: "subtitles", label: "Subtitles", icon: Subtitles },
];

function StudioPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  // New Live Media Hydration States
  const [streamData, setStreamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Tracks the exact location of the current playing frame
  const [currentTime, setCurrentTime] = useState(0);

  const [activeTab, setActiveTab] = useState("trim");
  const [isPlaying, setIsPlaying] = useState(false);

  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [subtitles, setSubtitles] = useState("");

  //  Fetch Video Records & Playback Credentials on Mount
  useEffect(() => {
    async function hydrateStudio() {
      try {
        setLoading(true);
        setError(null);

        // Pull down the formal stream authorization tokens from Express
        const response = await api.get(`/files/${id}/playback`);
        setStreamData(response.data);
      } catch (err) {
        console.error("Studio Hydration Failure:", err);
        setError(err.response?.data?.message || "Failed to load studio assets.");
      } finally {
        setLoading(false);
      }
    }

    if (id) hydrateStudio();
    else navigate("/videos");
  }, [id, navigate]);

  //  Bind the Tokenized HLS Streaming Engine to the Player Canvas
  useEffect(() => {
    if (!streamData?.playbackUrl || !videoRef.current) return;

    const video = videoRef.current;
    const streamUrl = streamData.playbackUrl;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 15, // Keep buffer small for snappy scrubbing in the editor

        //  THE INTERCEPTOR: Silently rolls streaming tokens over in the background
        xhrSetup: async (xhr, url) => {
          if (url.includes("/stream/")) {
            try {
              const response = await api.get(`/files/${id}/playback`);
              const freshToken = new URL(response.data.playbackUrl).searchParams.get("token");
              const finalUrl = new URL(url);
              finalUrl.searchParams.set("token", freshToken);
              xhr.open("GET", finalUrl.toString(), true);
            } catch (err) {
              console.error("Studio loop refresh fail:", err);
            }
          }
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hlsRef.current = hls;
    }
    // Native Safari Fallback
    else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamData, id]);

  //  Enforce the boundaries while the video is actively playing or scrubbing
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;


    setCurrentTime(video.currentTime);
    // Rule A: If the user plays/scrubs past the END marker, loop back to the start marker
    if (video.currentTime >= endTime && endTime > 0) {
      video.currentTime = startTime;

      // Optional: If you don't want it to loop automatically, uncomment below:
      // video.pause();
      // setIsPlaying(false);
    }

    // Rule B: If the player head somehow drifts BEFORE the START marker, snap it forward
    if (video.currentTime < startTime) {
      video.currentTime = startTime;
    }
  };

  //  Live-sync the video playhead when the user adjusts the START handle input slider
  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart);

    // Snap the video frame instantly to the new start point so the user sees a visual preview of their cut
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  // Live-sync the video playhead when the user adjusts the END handle input slider
  const handleEndTimeChange = (newEnd) => {
    setEndTime(newEnd);

    // If the video's current time is suddenly outside the new end bound, snap it back to start
    if (videoRef.current && videoRef.current.currentTime > newEnd) {
      videoRef.current.currentTime = startTime;
    }
  };

  //  Securely track HTML5 native events to keep the React state from flickering
  const handlePlayEvent = () => setIsPlaying(true);
  const handlePauseEvent = () => setIsPlaying(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const videoDuration = Math.floor(videoRef.current.duration);
    setDuration(videoDuration);
    setEndTime(videoDuration); // Dynamically set initial end slider to max duration
  };

  const formatSeconds = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
// 4. API Request Package Construction (Synchronized to your RabbitMQ backend router)
  const handleExport = async () => {
    try {
      const payload = {
        trim: { 
          start: startTime, 
          end: endTime 
        },
        crop: { 
          ratio: aspectRatio 
        }
      };

      console.log("🚀 Dispatching structural matrix parameters to RabbitMQ channel:", payload);
      
      // Hit your secure, protected router endpoint using your Axios configuration instance
      const response = await api.post(`/files/${id}/export`, payload);
      
      alert("🚀 Video editing job dispatched to RabbitMQ processing cluster.");
      console.log("Server queue response receipt confirmation:", response.data);
    } catch (err) {
      console.error("Export submission execution loop failure:", err);
      alert(err.response?.data?.message || "Failed to submit export task.");
    }
  };

  // Render Defensive Boundary Framework State UIs
  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-mono uppercase tracking-widest">Loading Studio Environment...</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3 text-destructive max-w-sm mx-auto text-center">
          <AlertCircle className="h-8 w-8" />
          <p className="text-sm font-medium">{error}</p>
          <Link to="/dashboard" className="text-xs text-primary underline mt-2">Return to Dashboard</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/dashboard" className="font-display text-2xl tracking-tighter uppercase text-primary">
              Videoflow
            </Link>
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium text-sm"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          <Link to={`/videos/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Video
          </Link>

          <div className="mb-8">
            <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">Video Studio</p>
            {/*  Real video title pulled from backend metadata mapping */}
            <h1 className="font-display text-4xl uppercase tracking-tight">{streamData?.title || "Project Track"}</h1>
          </div>

          {/*  THE LIVE ACTIVE SECURED VIDEO WRAPPER CANVAS */}
          <div className="w-full flex items-center justify-center p-4 rounded-xl border border-border bg-card mb-8 min-h-[40vh]">
            <div
              className="relative bg-black rounded-lg overflow-hidden shadow-2xl flex items-center justify-center w-full max-w-2xl transition-all duration-300"
              style={{
                aspectRatio: aspectRatio === "16:9" ? "16/9" :
                  aspectRatio === "9:16" ? "9/16" :
                    aspectRatio === "1:1" ? "1/1" : "4/3" 
              }}
            >
              <video
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlayEvent}   //  Tracks spacebar or external native play triggers
                onPause={handlePauseEvent} //  Tracks native pauses cleanly
                playsInline
                onClick={togglePlay}
                className="w-full h-full object-cover cursor-pointer"
                poster={streamData?.thumbnailUrl}
              />
              <button
                onClick={togglePlay}
                className="absolute p-4 rounded-full bg-black/60 text-white border border-white/20 backdrop-blur-sm hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-white" />}
              </button>
            </div>
          </div>

   
          {/*  THE VISUAL TIMELINE SLIDER */}
          <div className="rounded-xl border border-border bg-card p-5 mb-8">
            <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground mb-3 font-mono">
              <span>Trim Window: {formatSeconds(startTime)} - {formatSeconds(endTime)}</span>
              {/* Show the active timestamp of the playhead pointer */}
              <span className="text-primary font-bold">Current: {formatSeconds(currentTime)}</span>
              <span>Total Duration: {formatSeconds(duration)}</span>
            </div>

            <div className="h-16 rounded-lg bg-white/[0.02] border border-border relative flex items-center px-4 select-none overflow-hidden">

              {/* Handle 1: Start Time Range Slider */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={startTime}
                onChange={(e) => handleStartTimeChange(Math.min(Number(e.target.value), endTime - 1))}
                className="absolute left-4 right-4 h-2 appearance-none bg-transparent pointer-events-none z-30 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-muted-foreground [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:appearance-none"
              />

              {/* Handle 2: End Time Range Slider */}
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={endTime}
                onChange={(e) => handleEndTimeChange(Math.max(Number(e.target.value), startTime + 1))}
                className="absolute left-4 right-4 h-2 appearance-none bg-transparent pointer-events-none z-30 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-muted-foreground [&::-webkit-slider-thumb]:rounded-md [&::-webkit-slider-thumb]:appearance-none"
              />

              {/*  THE LIVE PLAYHEAD POINTER LINE */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
                style={{
                  left: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  boxShadow: "0 0 8px var(--primary)" // Gives it a subtle glow effect
                }}
              />

              {/* Highlighted Trim Selection Safebox Area */}
              <div
                className="absolute h-12 bg-primary/10 border-x border-primary/40 rounded-sm"
                style={{
                  left: `${duration ? (startTime / duration) * 100 : 0}%`,
                  right: `${duration ? 100 - (endTime / duration) * 100 : 100}%`
                }}
              />
            </div>
          </div>

          {/* Control Configuration Panels */}
          <div className="grid lg:grid-cols-[220px_1fr] gap-6">
            <div className="flex lg:flex-col gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors font-medium text-sm ${activeTab === tab.id ? "bg-primary/10 text-primary" : "hover:bg-white/[0.03] text-muted-foreground"
                      }`}
                  >
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              {activeTab === "trim" && (
                <div className="space-y-5 max-w-sm">
                  <h2 className="font-display text-2xl uppercase tracking-tight">Trim Video</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">Start Time</label>
                      <div className="w-full h-11 px-4 flex items-center rounded-lg border border-border bg-background text-sm font-mono">{formatSeconds(startTime)}</div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">End Time</label>
                      <div className="w-full h-11 px-4 flex items-center rounded-lg border border-border bg-background text-sm font-mono">{formatSeconds(endTime)}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "crop" && (
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-tight mb-5">Crop Aspect Ratio</h2>
                  <div className="flex flex-wrap gap-3">
                    {["16:9", "9:16", "1:1", "4:3"].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all ${aspectRatio === ratio ? "border-primary text-primary bg-primary/10 scale-105" : "border-border hover:bg-white/[0.02]"
                          }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "subtitles" && (
                <div>
                  <h2 className="font-display text-2xl uppercase tracking-tight mb-5">Subtitles Editor</h2>
                  <textarea
                    rows={6}
                    value={subtitles}
                    onChange={(e) => setSubtitles(e.target.value)}
                    placeholder={`00:01 Introduction line...`}
                    className="w-full rounded-lg border border-border bg-background p-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}

export default StudioPage;