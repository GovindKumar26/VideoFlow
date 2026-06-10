// import AppShell from "@/components/layout/AppShell";
// import { Link } from "react-router-dom";

// function Dashboard() {
//   const stats = [
//     {
//       label: "Videos",
//       value: "18",
//     },
//     {
//       label: "Storage",
//       value: "12.4 GB",
//     },
//     {
//       label: "Views",
//       value: "4.2K",
//     },
//     {
//       label: "Bandwidth",
//       value: "82 GB",
//     },
//   ];

//   const videos = [
//     {
//       id: 1,
//       title: "Product Demo.mp4",
//       status: "Ready",
//       duration: "4:12",
//       views: "1.2K",
//     },
//     {
//       id: 2,
//       title: "Course Intro.mp4",
//       status: "Processing",
//       duration: "--",
//       views: "--",
//     },
//     {
//       id: 3,
//       title: "Launch Trailer.mp4",
//       status: "Ready",
//       duration: "1:45",
//       views: "870",
//     },
//   ];

//   return (
//     <AppShell>
//     <div className="min-h-screen bg-background text-foreground">
//       {/* Header */}
//       <header className="border-b border-border">
//         <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
//           <Link
//             to="/"
//             className="font-display text-2xl tracking-tighter uppercase text-primary"
//           >
//             Videoflow
//           </Link>

//           <div className="flex items-center gap-3">
//             <button className="px-4 py-2 text-sm rounded-md border border-border hover:bg-white/5 transition-colors">
//               Settings
//             </button>

//             <button className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
//               Upload Video
//             </button>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-6 py-10">
//         {/* Welcome */}
//         <div className="mb-10">
//           <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
//             Creator Dashboard
//           </p>

//           <h1 className="font-display text-5xl uppercase tracking-tighter">
//             Welcome Back
//           </h1>

//           <p className="text-muted-foreground mt-3">
//             Manage uploads, monitor streams, and review analytics.
//           </p>
//         </div>

//         {/* Stats */}
//         <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
//           {stats.map((stat) => (
//             <div
//               key={stat.label}
//               className="rounded-xl border border-border bg-card p-6"
//             >
//               <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mb-3">
//                 {stat.label}
//               </p>

//               <h2 className="font-display text-4xl tracking-tighter">
//                 {stat.value}
//               </h2>
//             </div>
//           ))}
//         </section>

//         {/* Quick Actions */}
//         <section className="mb-10">
//           <h2 className="font-display text-2xl uppercase tracking-tight mb-4">
//             Quick Actions
//           </h2>

//           <div className="flex flex-wrap gap-4">
//             <button className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium">
//               Upload Video
//             </button>

//             <button className="px-5 py-3 rounded-lg border border-border hover:bg-white/5">
//               Record Screen
//             </button>

//             <button className="px-5 py-3 rounded-lg border border-border hover:bg-white/5">
//               Create Folder
//             </button>
//           </div>
//         </section>

//         {/* Recent Uploads */}
//         <section>
//           <h2 className="font-display text-2xl uppercase tracking-tight mb-4">
//             Recent Uploads
//           </h2>

//           <div className="rounded-xl border border-border overflow-hidden">
//             <table className="w-full">
//               <thead className="border-b border-border bg-card">
//                 <tr>
//                   <th className="text-left px-6 py-4 text-xs uppercase tracking-widest font-mono text-muted-foreground">
//                     Video
//                   </th>

//                   <th className="text-left px-6 py-4 text-xs uppercase tracking-widest font-mono text-muted-foreground">
//                     Status
//                   </th>

//                   <th className="text-left px-6 py-4 text-xs uppercase tracking-widest font-mono text-muted-foreground">
//                     Duration
//                   </th>

//                   <th className="text-left px-6 py-4 text-xs uppercase tracking-widest font-mono text-muted-foreground">
//                     Views
//                   </th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {videos.map((video) => (
//                   <tr
//                     key={video.id}
//                     className="border-b border-border last:border-0 hover:bg-white/[0.02]"
//                   >
//                     <td className="px-6 py-4">
//                       {video.title}
//                     </td>

//                     <td className="px-6 py-4">
//                       <span
//                         className={`text-sm ${
//                           video.status === "Ready"
//                             ? "text-green-400"
//                             : "text-amber-400"
//                         }`}
//                       >
//                         {video.status}
//                       </span>
//                     </td>

//                     <td className="px-6 py-4">
//                       {video.duration}
//                     </td>

//                     <td className="px-6 py-4">
//                       {video.views}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </section>
//       </main>
//     </div>
//   </AppShell>
//   );
// }

// export default Dashboard; 



import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, Video, HardDrive, Eye, Activity } from "lucide-react";
import { fetchVideos, fetchDashboardStats } from "@/features/videos/videoSlice";
import AppShell from "@/components/layout/AppShell";

function Dashboard() {
  const dispatch = useDispatch();

  // 1. Select dynamic streams out of your central Redux store cache
  const { 
    list: videos, 
    dashboardStats, 
    loading, 
    error 
  } = useSelector((state) => state.videos);

  // 2. Fetch live data when the dashboard component initializes
  useEffect(() => {
    dispatch(fetchVideos());
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // 3. Dynamically compile the stats grid map array
  const statsLayout = [
    {
      label: "Videos",
      value: dashboardStats?.totalVideos ?? "0",
      icon: <Video className="h-4 w-4 text-primary" />,
    },
    {
      label: "Storage",
      value: dashboardStats?.storageGb ? `${dashboardStats.storageGb} GB` : "0 GB",
      icon: <HardDrive className="h-4 w-4 text-emerald-400" />,
    },
    {
      label: "Views",
      value: dashboardStats?.totalViews ? Number(dashboardStats.totalViews).toLocaleString() : "0",
      icon: <Eye className="h-4 w-4 text-blue-400" />,
    },
    {
      label: "Bandwidth",
      value: dashboardStats?.bandwidthGb ? `${dashboardStats.bandwidthGb} GB` : "0 GB",
      icon: <Activity className="h-4 w-4 text-amber-400" />,
    },
  ];

  // 🛡️ API DATA RECOVERY SPINNER SHIELD
  if (loading && videos.length === 0) {
    return (
      <AppShell>
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest text-[10px]">
            Synchronizing Dashboard States...
          </p>
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

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm rounded-md border border-border hover:bg-white/5 transition-colors">
                Settings
              </button>
              <button className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Upload Video
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          {error && (
            <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Analytics Synchronization Failure: {error}</span>
            </div>
          )}

          {/* Welcome Info Context */}
          <div className="mb-10">
            <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
              Creator Dashboard
            </p>
            <h1 className="font-display text-5xl uppercase tracking-tighter">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mt-3">
              Manage uploads, monitor streams, and review analytics.
            </p>
          </div>

          {/* Stats Analytics Row Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            {statsLayout.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                    {stat.label}
                  </p>
                  {stat.icon}
                </div>
                <h2 className="font-display text-4xl tracking-tighter">
                  {stat.value}
                </h2>
              </div>
            ))}
          </section>

          {/* Quick Actions Panel */}
          <section className="mb-10">
            <h2 className="font-display text-2xl uppercase tracking-tight mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-wrap gap-4">
              <button className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium transition-transform active:scale-95">
                Upload Video
              </button>
              <button className="px-5 py-3 rounded-lg border border-border hover:bg-white/5 transition-colors">
                Record Screen
              </button>
              <button className="px-5 py-3 rounded-lg border border-border hover:bg-white/5 transition-colors">
                Create Folder
              </button>
            </div>
          </section>

          {/* Recent Uploads Table View */}
          <section>
            <h2 className="font-display text-2xl uppercase tracking-tight mb-4">
              Recent Uploads
            </h2>

            <div className="rounded-xl border border-border overflow-hidden bg-card/30 backdrop-blur-sm shadow-xl">
              {videos.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  No video records found in library repository. Upload an asset to initialize processing!
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="border-b border-border bg-card">
                    <tr>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-widest font-mono text-muted-foreground">Video</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-widest font-mono text-muted-foreground">Status</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-widest font-mono text-muted-foreground">Duration</th>
                      <th className="text-left px-6 py-4 text-xs uppercase tracking-widest font-mono text-muted-foreground">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.slice(0, 5).map((video) => (
                      <tr 
                        key={video._id} 
                        className="border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4 font-medium max-w-sm truncate text-foreground group-hover:text-primary transition-colors">
                          {/* 🎯 Wraps target title inside active react-router coordinates */}
                          <Link to={`/video/${video._id}`} className="block w-full h-full">
                            {video.originalName || "Unnamed Asset"}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            video.status === "transcoded"
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : video.status === "failed"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                          }`}>
                            {video.status === "transcoded" ? "Ready" : video.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-muted-foreground">
                          {video.duration || "--:--"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-foreground">
                          {video.views ? Number(video.views).toLocaleString() : "0"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
}

export default Dashboard;