// // import { Link, useNavigate, useParams } from "react-router-dom";
// // import {
// //   ArrowLeft,
// //   Eye,
// //   Clock,
// //   Calendar,
// //   Trash2,
// //   Scissors,
// //   Save,
// //   Loader2,
// //   AlertCircle,
// // } from "lucide-react";
// // import { useState, useEffect } from "react";
// // import { useDispatch, useSelector } from "react-redux";
// // import { fetchVideoById, updateVideoDetails, deleteVideo } from "@/features/videos/videoSlice";
// // import AppShell from "@/components/layout/AppShell";
// // import VideoPlayer from "./VideoPlayer";

// // function VideoDetailsPage() {
// //   const { id } = useParams();
// //   const navigate = useNavigate();
// //   const dispatch = useDispatch();

// //   const [editing, setEditing] = useState(false);
// //   const [titleInput, setTitleInput] = useState("");

// //   // Select current states from your central Redux slice cache
// //   const { currentVideo: video, loading, error } = useSelector((state) => state.videos);

// //   // 1. Fetch live metadata from backend when the URL ID target switches
// //   useEffect(() => {
// //     dispatch(fetchVideoById(id));
// //   }, [dispatch, id]);

// //   // 2. Sync the edit input text buffer immediately when backend values arrive
// //   useEffect(() => {
// //     if (video) {
// //       setTitleInput(video.originalName || "");
// //     }
// //   }, [video]);

// //   const handleSave = async () => {
// //     if (!titleInput.trim()) return;
// //     try {
// //       // Dispatch standard update action string
// //       await dispatch(updateVideoDetails({ id, title: titleInput })).unwrap();
// //       setEditing(false);
// //     } catch (err) {
// //       console.error("Failed to alter title metadata:", err);
// //       alert("Could not update title configuration.");
// //     }
// //   };

// //   const handleDelete = async () => {
// //     const confirmed = window.confirm("Are you sure you want to permanently delete this video?");
// //     if (!confirmed) return;

// //     try {
// //       await dispatch(deleteVideo(id)).unwrap();
// //       navigate("/videos"); // Route user back to dashboard array grid
// //     } catch (err) {
// //       console.error("Failed to remove document record:", err);
// //       alert("Error deleting file entry.");
// //     }
// //   };

// //   // Human-friendly date compiler wrapper for MongoDB ISO strings
// //   const formattedDate = video?.uploadDate
// //     ? new Date(video.uploadDate).toLocaleDateString("en-US", {
// //       month: "short",
// //       day: "numeric",
// //       year: "numeric",
// //     })
// //     : "N/A";

// //   //  API DATA RECOVERY SPINNER SHIELD
// //   if (loading) {
// //     return (
// //       <AppShell>
// //         <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3">
// //           <Loader2 className="h-8 w-8 animate-spin text-primary" />
// //           <p className="text-sm text-muted-foreground">Retrieving stream descriptors...</p>
// //         </div>
// //       </AppShell>
// //     );
// //   }

// //   //  ROUTE CORRUPTION ERROR BANNER SHIELD
// //   if (error) {
// //     return (
// //       <AppShell>
// //         <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
// //           <AlertCircle className="h-10 w-10 text-destructive mb-3" />
// //           <h2 className="text-xl font-medium mb-1">Metadata Synchronize Failure</h2>
// //           <p className="text-muted-foreground text-sm mb-6">{error}</p>
// //           <Link to="/videos" className="px-4 py-2 bg-muted border border-border rounded-lg text-sm">
// //             Return to Library
// //           </Link>
// //         </div>
// //       </AppShell>
// //     );
// //   }

// //   if (!video) return null;

// //   return (
// //     <AppShell>
// //       <div className="min-h-screen bg-background text-foreground">
// //         {/* Header */}
// //         <header className="border-b border-border">
// //           <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
// //             <Link to="/dashboard" className="font-display text-2xl tracking-tighter uppercase text-primary">
// //               Videoflow
// //             </Link>

// //             <Link to="/videos" className="text-sm text-muted-foreground hover:text-foreground">
// //               Back to Library
// //             </Link>
// //           </div>
// //         </header>

// //         <main className="max-w-6xl mx-auto px-6 py-10">
// //           <Link
// //             to="/videos"
// //             className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
// //           >
// //             <ArrowLeft className="h-4 w-4" />
// //             Back to videos
// //           </Link>

          
// //           {/* Dynamic Video Player Container Context */}
// //           <div className="aspect-video rounded-xl border border-border bg-black flex items-center justify-center mb-8 overflow-hidden relative shadow-2xl">
// //             {video.status === "transcoded" ? (
// //               <VideoPlayer videoId={video._id} />
// //             ) : (
// //               <div className="text-center p-6">
// //                 <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-400" />
// //                 <p className="text-lg font-medium capitalize text-amber-400 animate-pulse">{video.status}...</p>
// //                 <p className="text-sm text-muted-foreground mt-1">
// //                   FFmpeg encoding clusters are processing adaptive segmentation profiles.
// //                 </p>
// //               </div>
// //             )}
// //           </div>

// //           {/* Core Controls Row */}
// //           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
// //             <div className="flex-1">
// //               {editing ? (
// //                 <input
// //                   value={titleInput}
// //                   onChange={(e) => setTitleInput(e.target.value)}
// //                   className="w-full h-12 px-4 rounded-lg border border-border bg-card text-xl font-medium focus:outline-none focus:border-primary text-foreground"
// //                 />
// //               ) : (
// //                 <h1 className="font-display text-4xl uppercase tracking-tight truncate max-w-2xl">
// //                   {video.originalName}
// //                 </h1>
// //               )}
// //             </div>

// //             <div className="flex flex-wrap gap-3">
// //               {editing ? (
// //                 <button
// //                   onClick={handleSave}
// //                   className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-medium"
// //                 >
// //                   <Save className="h-4 w-4" />
// //                   Save
// //                 </button>
// //               ) : (
// //                 <button
// //                   onClick={() => setEditing(true)}
// //                   className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 text-sm font-medium"
// //                 >
// //                   Edit
// //                 </button>
// //               )}

// //               <Link
// //                 to={`/studio/${video._id}`}
// //                 className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 flex items-center gap-2 text-sm font-medium"
// //               >
// //                 <Scissors className="h-4 w-4" />
// //                 Open Studio
// //               </Link>

// //               <button
// //                 onClick={handleDelete}
// //                 className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-sm font-medium"
// //               >
// //                 <Trash2 className="h-4 w-4" />
// //                 Delete
// //               </button>
// //             </div>
// //           </div>

// //           {/* Dynamic Metric Information Cards Layout */}
// //           <div className="grid md:grid-cols-3 gap-6">
// //             <StatCard icon={<Eye className="h-4 w-4" />} label="Views" value={video.views || "0"} />

// //             <StatCard
// //               icon={<Clock className="h-4 w-4" />}
// //               label="Pipeline Status"
// //               value={video.status === "transcoded" ? "Ready" : video.status}
// //             />

// //             <StatCard icon={<Calendar className="h-4 w-4" />} label="Created" value={formattedDate} />
// //           </div>
// //         </main>
// //       </div>
// //     </AppShell>
// //   );
// // }
// // Inside VideoDetailsPage.jsx

// // function VideoDetailsPage() {
// //   const { id } = useParams();
// //   const dispatch = useDispatch();

// //   const [editing, setEditing] = useState(false);
// //   const [titleInput, setTitleInput] = useState("");

// //   // 1. Get the video metadata from your global Redux slice
// //   const { currentVideo: video, loading, error } = useSelector((state) => state.videos);

// //   // 2. Fetch the metadata once when the page loads
// //   useEffect(() => {
// //     dispatch(fetchVideoById(id));
// //   }, [dispatch, id]);

// //   useEffect(() => {
// //     if (video) {
// //       setTitleInput(video.originalName || "");
// //     }
// //   }, [video]);

// //   // 🛡️ API DATA RECOVERY SPINNER SHIELD (Only block if metadata is actively loading)
// //   if (loading && !video) {
// //     return (
// //       <AppShell>
// //         <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
// //           <Loader2 className="h-8 w-8 animate-spin text-primary" />
// //           <p className="text-sm text-muted-foreground">Retrieving video details...</p>
// //         </div>
// //       </AppShell>
// //     );
// //   }

// //   if (error) {
// //     return (
// //       <AppShell>
// //         <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
// //           <AlertCircle className="h-10 w-10 text-destructive mb-3" />
// //           <h2>Metadata Synchronize Failure</h2>
// //           <p className="text-muted-foreground text-sm">{error}</p>
// //         </div>
// //       </AppShell>
// //     );
// //   }

// //   // 🎯 REMOVED: The strict `if (!video) return null;` blocker at the top level

// //   return (
// //     <AppShell>
// //       <div className="min-h-screen bg-background text-foreground">
// //         <main className="max-w-6xl mx-auto px-6 py-10">
          
// //           {/* 🎥 Video Player Container */}
// //           <div className="aspect-video rounded-xl border border-border bg-black flex items-center justify-center mb-8 overflow-hidden relative shadow-2xl">
// //             {/* 🎯 Check the status safely using optional chaining */}
// //             {video?.status === "transcoded" ? (
// //               <VideoPlayer videoId={id} /> // 🚀 Mounts cleanly, triggering its internal useEffect!
// //             ) : (
// //               <div className="text-center p-6">
// //                 <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-400" />
// //                 <p className="text-lg font-medium text-amber-400 animate-pulse">
// //                   {video?.status || "Processing"}...
// //                 </p>
// //               </div>
// //             )}
// //           </div>

// //           {/* Core Controls Row */}
// //           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
// //             <div className="flex-1">
// //               {editing ? (
// //                 <input
// //                   value={titleInput}
// //                   onChange={(e) => setTitleInput(e.target.value)}
// //                   className="w-full h-12 px-4 rounded-lg border border-border bg-card text-foreground"
// //                 />
// //               ) : (
// //                 <h1 className="font-display text-4xl uppercase tracking-tight">
// //                   {video?.originalName || "Loading title..."}
// //                 </h1>
// //               )}
// //             </div>
// //             {/* ... rest of your buttons and StatCards remain identical */}
            
            
// //           </div>

// //         </main>
// //       </div>
// //     </AppShell>
// //   );
// // }
// // function StatCard({ icon, label, value }) {
// //   return (
// //     <div className="rounded-xl border border-border bg-card p-6">
// //       <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-muted-foreground mb-3">
// //         {icon}
// //         {label}
// //       </div>

// //       <p className="font-display text-2xl tracking-tight capitalize">
// //         {value}
// //       </p>
// //     </div>
// //   );
// // }

// // export default VideoDetailsPage;


// import { Link, useNavigate, useParams } from "react-router-dom";
// import {
//   ArrowLeft,
//   Eye,
//   Clock,
//   Calendar,
//   Trash2,
//   Scissors,
//   Save,
//   Loader2,
//   AlertCircle,
// } from "lucide-react";
// import { useState, useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchVideoById, updateVideoDetails, deleteVideo } from "@/features/videos/videoSlice";
// import AppShell from "@/components/layout/AppShell";
// import VideoPlayer from "./VideoPlayer";

// function VideoDetailsPage() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   const [editing, setEditing] = useState(false);
//   const [titleInput, setTitleInput] = useState("");

//   // 1. Extract structural media pipeline descriptors from the Redux cache layer
//   const { currentVideo: video, loading, error } = useSelector((state) => state.videos);

//   // 2. Initial synchronization handshake with the backend database
//   useEffect(() => {
//     dispatch(fetchVideoById(id));
//   }, [dispatch, id]);

//   // 3. Keep the editing text stream fully aligned with incoming state data updates
//   useEffect(() => {
//     if (video) {
//       setTitleInput(video.originalName || "");
//     }
//   }, [video]);

//   const handleSave = async () => {
//     if (!titleInput.trim()) return;
//     try {
//       await dispatch(updateVideoDetails({ id, title: titleInput })).unwrap();
//       setEditing(false);
//     } catch (err) {
//       console.error("Failed to alter title metadata:", err);
//       alert("Could not update title configuration.");
//     }
//   };

//   const handleDelete = async () => {
//     const confirmed = window.confirm("Are you sure you want to permanently delete this video?");
//     if (!confirmed) return;

//     try {
//       await dispatch(deleteVideo(id)).unwrap();
//       navigate("/videos"); // Retract context loop back to library gallery
//     } catch (err) {
//       console.error("Failed to remove document record:", err);
//       alert("Error deleting file entry.");
//     }
//   };

//   // Human-friendly date compiler fallback execution
//   const formattedDate = video?.uploadDate
//     ? new Date(video.uploadDate).toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//       })
//     : "N/A";

//   // 🛡️ API DATA RECOVERY SPINNER SHIELD
//   if (loading && !video) {
//     return (
//       <AppShell>
//         <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//           <p className="text-sm text-muted-foreground">Retrieving video details...</p>
//         </div>
//       </AppShell>
//     );
//   }

//   // 🛡️ ROUTE CORRUPTION ERROR BANNER SHIELD
//   if (error) {
//     return (
//       <AppShell>
//         <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
//           <AlertCircle className="h-10 w-10 text-destructive mb-3" />
//           <h2 className="text-xl font-medium mb-1">Metadata Synchronize Failure</h2>
//           <p className="text-muted-foreground text-sm mb-6">{error}</p>
//           <Link to="/videos" className="px-4 py-2 bg-muted border border-border rounded-lg text-sm">
//             Return to Library
//           </Link>
//         </div>
//       </AppShell>
//     );
//   }

//   return (
//     <AppShell>
//       <div className="min-h-screen bg-background text-foreground">
//         {/* Global Nav Header */}
//         <header className="border-b border-border">
//           <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
//             <Link to="/dashboard" className="font-display text-2xl tracking-tighter uppercase text-primary">
//               Videoflow
//             </Link>

//             <Link to="/videos" className="text-sm text-muted-foreground hover:text-foreground">
//               Back to Library
//             </Link>
//           </div>
//         </header>

//         <main className="max-w-6xl mx-auto px-6 py-10">
//           <Link
//             to="/videos"
//             className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
//           >
//             <ArrowLeft className="h-4 w-4" />
//             Back to videos
//           </Link>
          
//           {/* 🎥 Video Player Container */}
//           <div className="aspect-video rounded-xl border border-border bg-black flex items-center justify-center mb-8 overflow-hidden relative shadow-2xl">
//             {video?.status === "transcoded" ? (
//               <VideoPlayer videoId={id} /> 
//             ) : (
//               <div className="text-center p-6">
//                 <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-400" />
//                 <p className="text-lg font-medium text-amber-400 animate-pulse">
//                   {video?.status || "Processing"}...
//                 </p>
//                 <p className="text-sm text-muted-foreground mt-1">
//                   FFmpeg encoding clusters are processing adaptive segmentation profiles.
//                 </p>
//               </div>
//             )}
//           </div>

//           {/* Core Controls Row */}
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
//             <div className="flex-1">
//               {editing ? (
//                 <input
//                   value={titleInput}
//                   onChange={(e) => setTitleInput(e.target.value)}
//                   className="w-full h-12 px-4 rounded-lg border border-border bg-card text-xl font-medium focus:outline-none focus:border-primary text-foreground"
//                 />
//               ) : (
//                 <h1 className="font-display text-4xl uppercase tracking-tight truncate max-w-2xl">
//                   {video?.originalName || "Loading title..."}
//                 </h1>
//               )}
//             </div>
            
//             {/* Functional Action Toolbar Block */}
//             <div className="flex flex-wrap gap-3">
//               {editing ? (
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-medium"
//                 >
//                   <Save className="h-4 w-4" />
//                   Save
//                 </button>
//               ) : (
//                 <button
//                   onClick={() => setEditing(true)}
//                   className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 text-sm font-medium"
//                 >
//                   Edit
//                 </button>
//               )}

//               <Link
//                 to={`/studio/${id}`} // 🚀 Uses stable router hook id to prevent empty payload crashes
//                 className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 flex items-center gap-2 text-sm font-medium"
//               >
//                 <Scissors className="h-4 w-4" />
//                 Open Studio
//               </Link>

//               <button
//                 onClick={handleDelete}
//                 className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-sm font-medium"
//               >
//                 <Trash2 className="h-4 w-4" />
//                 Delete
//               </button>
//             </div>
//           </div>

//           {/* Dynamic Metric Information Cards Layout */}
//           <div className="grid md:grid-cols-3 gap-6">
//             <StatCard icon={<Eye className="h-4 w-4" />} label="Views" value={video?.views || "0"} />

//             <StatCard
//               icon={<Clock className="h-4 w-4" />}
//               label="Pipeline Status"
//               value={video?.status === "transcoded" ? "Ready" : video?.status || "Checking"}
//             />

//             <StatCard icon={<Calendar className="h-4 w-4" />} label="Created" value={formattedDate} />
//           </div>

//         </main>
//       </div>
//     </AppShell>
//   );
// }

// function StatCard({ icon, label, value }) {
//   return (
//     <div className="rounded-xl border border-border bg-card p-6">
//       <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-muted-foreground mb-3">
//         {icon}
//         {label}
//       </div>

//       <p className="font-display text-2xl tracking-tight capitalize">
//         {value}
//       </p>
//     </div>
//   );
// }

// export default VideoDetailsPage;



import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Clock,
  Calendar,
  Trash2,
  Scissors,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVideoById, updateVideoDetails, deleteVideo } from "@/features/videos/videoSlice";
import AppShell from "@/components/layout/AppShell";
import VideoPlayer from "./VideoPlayer";
import VideoDownloadsManager from "./VideoDownloadManager";
import VideoSharingPanel from "./VideoSharingPanel";
import EmbedModal from "../components/EmbedModal";
import VideoWhitelistSettings from "../components/VideoWhitelistSettings";



function VideoDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [editing, setEditing] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  // 1. Extract structural media pipeline descriptors from the Redux cache layer
  const { currentVideo: video, loading, error } = useSelector((state) => state.videos);

  // 2. Initial synchronization handshake with the backend database
  useEffect(() => {
    dispatch(fetchVideoById(id));
  }, [dispatch, id]);

  // 3. Keep the editing text stream fully aligned with incoming state data updates
  useEffect(() => {
    if (video) {
      setTitleInput(video.originalName || "");
    }
  }, [video]);

  const handleSave = async () => {
    if (!titleInput.trim()) return;
    try {
      await dispatch(updateVideoDetails({ id, title: titleInput })).unwrap();
      setEditing(false);
    } catch (err) {
      console.error("Failed to alter title metadata:", err);
      alert("Could not update title configuration.");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to permanently delete this video?");
    if (!confirmed) return;

    try {
      await dispatch(deleteVideo(id)).unwrap();
      navigate("/videos"); // Retract context loop back to library gallery
    } catch (err) {
      console.error("Failed to remove document record:", err);
      alert("Error deleting file entry.");
    }
  };

  // Human-friendly date compiler fallback execution
  const formattedDate = video?.uploadDate
    ? new Date(video.uploadDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  // 🛡️ API DATA RECOVERY SPINNER SHIELD
  if (loading && !video) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Retrieving video details...</p>
        </div>
      </AppShell>
    );
  }

  // 🛡️ ROUTE CORRUPTION ERROR BANNER SHIELD
  if (error) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h2 className="text-xl font-medium mb-1">Metadata Synchronize Failure</h2>
          <p className="text-muted-foreground text-sm mb-6">{error}</p>
          <Link to="/videos" className="px-4 py-2 bg-muted border border-border rounded-lg text-sm">
            Return to Library
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-background text-foreground">
        {/* Global Nav Header */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/dashboard" className="font-display text-2xl tracking-tighter uppercase text-primary">
              Videoflow
            </Link>

            <Link to="/videos" className="text-sm text-muted-foreground hover:text-foreground">
              Back to Library
            </Link>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to videos
          </Link>
          
          {/* 🎥 Video Player Container */}
          <div className="aspect-video rounded-xl border border-border bg-black flex items-center justify-center mb-8 overflow-hidden relative shadow-2xl">
            {video?.status === "transcoded" ? (
              <VideoPlayer videoId={id} /> 
            ) : (
              <div className="text-center p-6">
                <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-amber-400" />
                <p className="text-lg font-medium text-amber-400 animate-pulse">
                  {video?.status || "Processing"}...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  FFmpeg encoding clusters are processing adaptive segmentation profiles.
                </p>
              </div>
            )}
          </div>

          {/* Core Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="flex-1">
              {editing ? (
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-border bg-card text-xl font-medium focus:outline-none focus:border-primary text-foreground"
                />
              ) : (
                <h1 className="font-display text-4xl uppercase tracking-tight truncate max-w-2xl">
                  {video?.originalName || "Loading title..."}
                </h1>
              )}
            </div>
            
            {/* Functional Action Toolbar Block */}
            <div className="flex flex-wrap gap-3">
              {editing ? (
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 text-sm font-medium"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 text-sm font-medium"
                >
                  Edit
                </button>
              )}

              <Link
                to={`/studio/${id}`} 
                className="px-4 py-2 rounded-lg border border-border hover:bg-white/5 flex items-center gap-2 text-sm font-medium"
              >
                <Scissors className="h-4 w-4" />
                Open Studio
              </Link>

              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          {/* Unified Details Dashboard Layout Layout Grid */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            
            {/* Left Column: Dynamic Metric Information Cards Layout */}
            <div className="grid sm:grid-cols-3 lg:grid-cols-1 gap-4">
              <StatCard icon={<Eye className="h-4 w-4" />} label="Views" value={video?.views || "0"} />

              <StatCard
                icon={<Clock className="h-4 w-4" />}
                label="Pipeline Status"
                value={video?.status === "transcoded" ? "Ready" : video?.status || "Checking"}
              />

              <StatCard icon={<Calendar className="h-4 w-4" />} label="Created" value={formattedDate} />
            </div>

            {/* Right Column: Unified Download Option Panels Workspace */}
            <div className="w-full">
              <VideoDownloadsManager videoId={id} />
              <VideoSharingPanel videoId={id} />
            </div>

            {/* 📋 Section 1: The Code Snippet Delivery Canvas */}
                <EmbedModal videoId={id} />

                {/* 🔒 Section 2: Enforces Website Domain Restrictions */}
                <VideoWhitelistSettings videoId={id} />

          </div>
        </main>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-muted-foreground mb-3">
        {icon}
        {label}
      </div>

      <p className="font-display text-2xl tracking-tight capitalize">
        {value}
      </p>
    </div>
  );
}

export default VideoDetailsPage;