function StudioSection() {
  const features = [
    {
      tag: "01 / RECORD",
      title: "Browser Screen & Cam Capture",
      body: "Launch a recording modal directly in the browser. Capture screen, webcam, or both with picture-in-picture. No desktop app, no extensions — just hit record.",
    },
    {
      tag: "02 / INGEST",
      title: "Resilient Multi-Gigabyte Uploads",
      body: "Drag and drop files of any size. Uploads pause, resume, and recover automatically through dropped wifi, sleeping laptops, and flaky tethers.",
    },
    {
      tag: "03 / EDIT",
      title: "Timeline Trim, Crop & Reframe",
      body: "Trim heads and tails, crop to 9:16 vertical for Reels & Shorts, or reframe to 1:1 for social — all inside a frame-accurate timeline.",
    },
    {
      tag: "04 / SUBTITLE",
      title: "AI Auto-Generated Captions",
      body: "Speech-to-text in 30+ languages with editable .vtt output. Burn in captions for social, or attach as a sidecar track for accessibility.",
    },
    {
      tag: "05 / ORGANIZE",
      title: "Studio Library",
      body: "A YouTube-Studio-style grid of every asset — thumbnails, durations, views, status. Search, tag, and bulk-edit across thousands of clips.",
    },
    {
      tag: "06 / PRIVACY",
      title: "Per-Asset Access Controls",
      body: "Toggle public, unlisted, or private per video. Lock with a password, restrict by email domain, or expire links on a schedule.",
    },
  ];

  return (
    <section id="studio" className="py-24 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 max-w-2xl">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            The Studio
          </p>

          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-tighter mb-6">
            From raw take to ready cut.
          </h2>

          <p className="text-muted-foreground text-lg">
            Everything a creator needs to capture, polish, and publish — no installs,
            no plugins, no third-party editor.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group p-8 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-primary/30 transition-all"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4">
                {feature.tag}
              </div>

              <h3 className="font-display text-2xl uppercase mb-3 tracking-tight">
                {feature.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StudioSection;