import { Link } from "react-router-dom";
import { Search, Film, Eye, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import AppShell from "@/components/layout/AppShell";
import { fetchVideos } from "@/features/videos/videoSlice";

function VideosPage() {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");

  //  Pull dynamic store states from the unified videoSlice
  const { list: videos, loading, error } = useSelector((state) => state.videos);

  // Dispatch the API call cleanly when the component mounts
  useEffect(() => {
    dispatch(fetchVideos());
  }, [dispatch]);

  // Map searches against your genuine MongoDB text fields (originalName)
  const filteredVideos = videos.filter((video) =>
    video.originalName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              to="/dashboard"
              className="font-display text-2xl tracking-tighter uppercase text-primary"
            >
              Videoflow
            </Link>

            <Link
              to="/upload"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Upload Video
            </Link>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-10">
          {/* Heading */}
          <div className="mb-8">
            <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
              Video Library
            </p>

            <h1 className="font-display text-5xl uppercase tracking-tighter">
              Videos
            </h1>

            <p className="text-muted-foreground mt-3">
              Browse, search, and manage your uploaded content.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative max-w-md mb-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-border bg-card focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* ⏳ 1. GLOBAL NETWORK LOADING STATE */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your media library...</p>
            </div>
          ) : error ? (
            /* ❌ 2. BACKEND API RUNTIME ERROR BANNER */
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 max-w-md mx-auto text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p>Error loading library: {error}</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            /* 📭 3. NO VIDEOS EMPTY STATE */
            <div className="rounded-xl border border-dashed border-border py-20 text-center">
              <Film className="h-10 w-10 mx-auto text-muted-foreground mb-4" />

              <h2 className="text-xl font-medium mb-2">
                No videos found
              </h2>

              <p className="text-muted-foreground mb-6">
                Try another search term or get started by uploading a new video.
              </p>

              <Link
                to="/upload"
                className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium"
              >
                Upload Video
              </Link>
            </div>
          ) : (
            /* 🎬 4. LIVE BACKEND METADATA GRID DISPLAY */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => {
                // Point safely to your storage system bucket base address
                const storageBaseUrl = "http://localhost:9000/uploads/";
                const hasThumbnail = video.thumbnailKey && video.status === "transcoded";

                return (
                  <Link
                    key={video._id} // 🎯 Fixed: Use MongoDB unique identifier keys
                    to={`/videos/${video._id}`}
                    className="group rounded-xl overflow-hidden border border-border bg-card hover:bg-white/[0.03] transition-all duration-200 hover:scale-[1.01]"
                  >
                    {/* Thumbnail Layout Group */}
                    <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden border-b border-border">
                      {hasThumbnail ? (
                        <img
                          src={`${storageBaseUrl}${video.thumbnailKey}`}
                          alt={video.originalName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-white/30">
                          <Film className="h-8 w-8" />
                          {video.status !== "transcoded" && video.status !== "failed" && (
                            <span className="text-[10px] font-mono uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded animate-pulse">
                              {video.status || "Processing"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Meta-Content Details Card Body */}
                    <div className="p-4">
                      <h3 className="font-medium mb-3 truncate group-hover:text-primary transition-colors text-foreground">
                        {video.originalName}
                      </h3>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
                        {/* Dynamic Pipeline Pipeline Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            video.status === "transcoded"
                              ? "text-green-400"
                              : video.status === "failed"
                              ? "text-red-400"
                              : "text-amber-400 animate-pulse"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {video.status === "transcoded" ? "Ready" : video.status}
                        </span>

                        {/* Analytic Context Data Tags */}
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.views || 0} views
                        </span>

                        {/* Explicit visibility state display flag */}
                        {video.visibility && (
                          <span className="capitalize border border-border/60 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight ml-auto">
                            {video.visibility}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}

export default VideosPage;