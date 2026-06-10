function DevelopersSection() {
  return (
    <section
      id="developers"
      className="py-24 px-6 border-t border-border bg-white/[0.02]"
    >
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            Developer Console
          </p>

          <h2 className="font-display text-4xl md:text-5xl uppercase mb-6 tracking-tighter">
            Built for <span className="text-primary">Architects</span>
          </h2>

          <p className="text-muted-foreground mb-8">
            Complete control over your media lifecycle. Issue API tokens,
            configure webhook callbacks, and replay failed deliveries from the
            Dead Letter Queue without ever leaving the console.
          </p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-primary">
                  WEBHOOK_LOG_LIVE
                </span>

                <span className="text-[10px] font-mono text-muted-foreground">
                  ID: wh_84x9
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs font-mono text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>200 OK</span>
                  <span className="text-muted-foreground">
                    video.ingest.completed
                  </span>
                  <span className="ml-auto text-white/30">12ms</span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-amber-400">
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  <span>422 ERROR</span>
                  <span className="text-muted-foreground">
                    video.transcode.failed
                  </span>

                  <button className="ml-auto text-primary underline underline-offset-4 decoration-primary/30">
                    Requeue
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-emerald-400 opacity-60">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>200 OK</span>
                  <span className="text-muted-foreground">
                    user.access.revoked
                  </span>
                  <span className="ml-auto text-white/30">8ms</span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-emerald-400 opacity-40">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>200 OK</span>
                  <span className="text-muted-foreground">
                    asset.subtitle.ready
                  </span>
                  <span className="ml-auto text-white/30">45ms</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  API Key
                </div>

                <div className="font-mono text-xs text-foreground truncate">
                  VF_API_KEY_••••_8x29
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  DLQ Pending
                </div>

                <div className="font-mono text-xs text-amber-400">
                  2 events
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-white/10 p-6 font-mono text-sm leading-relaxed">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-2.5 rounded-full bg-white/10" />
            <div className="size-2.5 rounded-full bg-white/10" />
            <div className="size-2.5 rounded-full bg-white/10" />

            <span className="ml-2 text-[10px] text-muted-foreground tracking-widest">
              EMBED_CODE.HTML
            </span>
          </div>

          <div className="space-y-1 text-sm">
            <div className="text-white/40">
              &lt;<span className="text-primary">iframe</span>
            </div>

            <div className="pl-4 text-white/80">
              src=
              <span className="text-emerald-300">
                "https://videoflow.io/embed/v_772"
              </span>
            </div>

            <div className="pl-4 text-white/80">
              width=<span className="text-amber-200">"1280"</span>
              {" "}
              height=<span className="text-amber-200">"720"</span>
            </div>

            <div className="pl-4 text-white/80">
              loading=<span className="text-emerald-300">"lazy"</span>
            </div>

            <div className="pl-4 text-white/80">
              allow=
              <span className="text-emerald-300">
                "encrypted-media"
              </span>
            </div>

            <div className="text-white/40">/&gt;</div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5">
            <button className="w-full py-2.5 bg-white text-black font-semibold rounded text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-colors">
              Copy snippet
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {["1080p", "720p", "480p"].map((quality) => (
              <div
                key={quality}
                className="text-center py-2 bg-white/[0.03] border border-white/10 rounded text-[10px] font-mono text-muted-foreground"
              >
                {quality}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default DevelopersSection;