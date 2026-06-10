function PlatformSection() {
  const features = [
    {
      title: "Capture & Ingest",
      body: "Drag-and-drop multi-gigabyte uploads with resume-on-disconnect. Native browser screen + cam recording, zero installs.",
      tag: "RECORD",
    },
    {
      title: "Edit & Master",
      body: "Trim, crop to 9:16 vertical, toggle AI auto-subtitles. Privacy controls (public / private / unlisted) per asset.",
      tag: "STUDIO",
    },
    {
      title: "Distribute & Defend",
      body: "Forensic per-viewer watermarks burned into pixels. Adaptive HLS shifts resolutions silently to prevent buffering.",
      tag: "DELIVER",
    },
  ];

  return (
    <section
      id="platform"
      className="py-24 px-6 border-t border-border"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            The Platform
          </p>

          <h2 className="font-display text-4xl md:text-5xl uppercase tracking-tighter">
            One pipeline. Every workflow.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-background p-8 hover:bg-white/[0.02] transition-colors"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-6">
                {feature.tag}
              </div>

              <h3 className="font-display text-2xl uppercase mb-4">
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

export default PlatformSection;