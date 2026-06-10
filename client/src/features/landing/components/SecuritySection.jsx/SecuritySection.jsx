import heroFrame from "@/assets/hero-frame.jpg";

function SecuritySection() {
  const securityFeatures = [
    {
      tag: "Pixel Watermark",
      title: "Server-Side Brand Burn",
      color: "border-primary",
      tagColor: "text-primary",
      body: "Your platform logo is permanently encoded into the video pixels at transcode time. Cannot be cropped or stripped without destroying playback quality.",
    },
    {
      tag: "Forensic Overlay",
      title: "Per-Viewer Email Trace",
      color: "border-accent",
      tagColor: "text-accent",
      body: "A floating, animated overlay of the viewer's signed-in email follows their screen in real time. A leaked recording names its source instantly.",
    },
    {
      tag: "Adaptive HLS",
      title: "Zero-Buffer Streaming",
      color: "border-emerald-400",
      tagColor: "text-emerald-400",
      body: "Six bitrate ladders from 240p to 4K served over HLS. Scrapers get 403, paying viewers get pixels.",
    },
  ];

  return (
    <section
      id="security"
      className="py-24 px-6 border-t border-border bg-white/[0.02]"
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            Security & Delivery
          </p>

          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-tighter mb-6">
            Pirate-proof your stream.
          </h2>

          <p className="text-muted-foreground text-lg mb-8">
            Two layers of forensic defence wrap every playback — invisible to
            the audience, traceable down to the individual viewer.
          </p>

          <div className="space-y-5">
            {securityFeatures.map((feature) => (
              <div
                key={feature.title}
                className={`border-l-2 ${feature.color} pl-5`}
              >
                <div
                  className={`text-[10px] font-mono uppercase tracking-widest ${feature.tagColor} mb-1`}
                >
                  {feature.tag}
                </div>

                <div className="font-display text-xl uppercase mb-1">
                  {feature.title}
                </div>

                <p className="text-muted-foreground text-sm">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Watermark Preview */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl rounded-2xl" />

          <div className="relative aspect-video rounded-xl border border-white/10 overflow-hidden bg-zinc-900">
            <img
              src={heroFrame}
              alt="Stream with forensic watermark"
              className="w-full h-full object-cover opacity-80"
            />

            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-black/40" />

            <div className="absolute top-4 left-4 font-display text-xs uppercase tracking-widest text-white/80 bg-black/40 px-2 py-1 border border-white/10">
              VIDEOFLOW
            </div>

            <div className="absolute top-1/3 left-1/4 text-xs font-mono text-white/40 -rotate-6 select-none">
              leak.tracer@studio.tv
            </div>

            <div className="absolute top-1/2 right-1/4 text-xs font-mono text-white/30 rotate-3 select-none">
              leak.tracer@studio.tv
            </div>

            <div className="absolute bottom-1/4 left-1/3 text-xs font-mono text-white/40 select-none">
              leak.tracer@studio.tv
            </div>

            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-emerald-400 bg-black/40 border border-emerald-400/30 px-2 py-1">
              ● HLS / 4K / SIGNED
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SecuritySection;