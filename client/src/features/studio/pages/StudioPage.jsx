import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Scissors,
  Crop,
  Subtitles,
  Download,
  Play,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const TABS = [
  {
    id: "trim",
    label: "Trim",
    icon: Scissors,
  },
  {
    id: "crop",
    label: "Crop",
    icon: Crop,
  },
  {
    id: "subtitles",
    label: "Subtitles",
    icon: Subtitles,
  },
];

function StudioPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("trim");

  const [trimStart, setTrimStart] = useState("00:00");
  const [trimEnd, setTrimEnd] = useState("04:12");

  const [aspectRatio, setAspectRatio] = useState("16:9");

  const [subtitles, setSubtitles] = useState("");

  const video = {
    id,
    title: "Product Demo",
    duration: "04:12",
  };

  useEffect(() => {
    if (!id) {
      navigate("/videos");
    }
  }, [id, navigate]);

  return (
    <AppShell >
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

          <button
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Back */}
        <Link
          to={`/videos/${video.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Video
        </Link>

        {/* Title */}
        <div className="mb-8">
          <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
            Video Studio
          </p>

          <h1 className="font-display text-4xl uppercase tracking-tight">
            {video.title}
          </h1>
        </div>

        {/* Preview */}
        <div className="aspect-video rounded-xl border border-border bg-gradient-to-br from-primary/20 via-white/[0.03] to-transparent flex items-center justify-center mb-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
              <Play className="h-6 w-6" />
            </div>

            <p className="text-sm text-muted-foreground">
              Editor Preview
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-border bg-card p-5 mb-8">
          <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground mb-3">
            <span>Timeline</span>
            <span>{video.duration}</span>
          </div>

          <div className="h-16 rounded-lg bg-white/[0.04] relative overflow-hidden">
            <div className="absolute inset-y-0 left-[10%] right-[15%] bg-primary/30 border-x-2 border-primary" />

            <div className="absolute inset-0 flex items-center gap-1 px-2">
              {Array.from({ length: 40 }).map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-8 rounded-sm bg-white/10"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          {/* Sidebar */}
          <div className="flex lg:flex-col gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-white/[0.03] text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Panel */}
          <div className="rounded-xl border border-border bg-card p-6">
            {activeTab === "trim" && (
              <div className="space-y-5 max-w-md">
                <h2 className="font-display text-2xl uppercase">
                  Trim Video
                </h2>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Start Time
                  </label>

                  <input
                    value={trimStart}
                    onChange={(e) => setTrimStart(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    End Time
                  </label>

                  <input
                    value={trimEnd}
                    onChange={(e) => setTrimEnd(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-border bg-background"
                  />
                </div>
              </div>
            )}

            {activeTab === "crop" && (
              <div>
                <h2 className="font-display text-2xl uppercase mb-5">
                  Crop Video
                </h2>

                <div className="flex flex-wrap gap-3">
                  {["16:9", "9:16", "1:1", "4:3"].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        aspectRatio === ratio
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border"
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
                <h2 className="font-display text-2xl uppercase mb-5">
                  Subtitles
                </h2>

                <textarea
                  rows={10}
                  value={subtitles}
                  onChange={(e) => setSubtitles(e.target.value)}
                  placeholder={`00:00 Welcome to the video

00:05 Today we are covering...`}
                  className="w-full rounded-lg border border-border bg-background p-4"
                />

                <button className="mt-4 px-4 py-2 rounded-lg border border-border hover:bg-white/[0.03]">
                  Auto Generate
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </AppShell >
  );
}

export default StudioPage;