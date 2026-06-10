import heroFrame from "@/assets/hero-frame.jpg";

function Hero() {
  return (
    <section className="relative pt-24 pb-32 px-6 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full" />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-widest uppercase mb-8 animate-entrance">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>

          Now Streaming: 8K HLS
        </div>

        <h1
          className="font-display text-6xl sm:text-7xl md:text-9xl uppercase tracking-tighter leading-[0.85] mb-8 animate-entrance"
          style={{ animationDelay: "100ms" }}
        >
          Cinematic{" "}
          <span className="text-white/20">
            Infrastructure
          </span>
        </h1>

        <p
          className="max-w-xl mx-auto text-muted-foreground text-lg mb-12 animate-entrance"
          style={{ animationDelay: "200ms" }}
        >
          High-performance video hosting for scale.
          Custom security layers, adaptive bitrates,
          and developer-first webhooks baked into every frame.
        </p>

        <div
          className="flex items-center justify-center gap-3 mb-16 animate-entrance"
          style={{ animationDelay: "250ms" }}
        >
          <button className="h-11 px-6 bg-white text-black font-semibold rounded-md hover:bg-primary hover:text-white transition-colors text-sm">
            Start streaming
          </button>

          <button className="h-11 px-6 border border-white/10 text-foreground font-medium rounded-md hover:bg-white/5 transition-colors text-sm">
            Read the docs
          </button>
        </div>

        <div
          className="relative max-w-5xl mx-auto group animate-entrance"
          style={{ animationDelay: "300ms" }}
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-orange-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />

          <div className="relative bg-zinc-900 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="w-full aspect-video bg-zinc-800 relative">
              <img
                src={heroFrame}
                alt="Cinematic video frame"
                width={1920}
                height={1088}
                className="w-full h-full object-cover"
              />

              <div className="absolute inset-0 bg-black/20" />

              <div className="absolute top-6 right-6 opacity-40 select-none">
                <span className="font-mono text-[10px] tracking-widest text-white/70 bg-black/40 px-2 py-1 border border-white/10">
                  USER_ID: VF-9831-ADMIN
                </span>
              </div>

              <div className="absolute bottom-1/3 left-1/3 opacity-20 pointer-events-none">
                <span className="text-xs font-mono text-white">
                  admin@videoflow.io (Stream Verified)
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="h-1 w-full bg-white/20 rounded-full mb-4">
                  <div className="h-full w-1/3 bg-primary rounded-full relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 size-3 bg-white rounded-full shadow-lg" />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <div className="size-4 bg-white/30 rounded-sm" />
                    <div className="size-4 bg-white/30 rounded-sm" />
                  </div>

                  <div className="text-[10px] font-mono text-white/70">
                    04:12 / 12:45 • 4K ULTRA HD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Hero;