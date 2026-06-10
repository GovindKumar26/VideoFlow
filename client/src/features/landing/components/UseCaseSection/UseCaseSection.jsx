function UseCasesSection() {
  const useCases = [
    {
      tag: "EDU",
      title: "Course Platforms",
      body: "Drip-release lessons with forensic watermarks. Stop screen-recording piracy before refunds hit.",
    },
    {
      tag: "SAAS",
      title: "Product Demo Hosting",
      body: "Embed marketing reels and onboarding videos with 4K HLS — no buffer, no third-party logo.",
    },
    {
      tag: "MED",
      title: "Telehealth & Training",
      body: "Private signed URLs, compliance-ready storage, per-viewer audit logs for review.",
    },
    {
      tag: "OTT",
      title: "Independent Streaming",
      body: "Launch your own Netflix-style channel. Adaptive bitrate, DRM-grade watermarks, edge delivery.",
    },
    {
      tag: "ENT",
      title: "Internal Comms",
      body: "All-hands recordings, training libraries, and exec broadcasts with SSO and email-trace overlays.",
    },
    {
      tag: "DEV",
      title: "API-First Video Apps",
      body: "Wire VideoFlow into your stack. Webhooks, programmatic uploads, and a DLQ that never loses an event.",
    },
  ];

  return (
    <section
      id="use-cases"
      className="py-24 px-6 border-t border-border"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            Use Cases
          </p>

          <h2 className="font-display text-4xl md:text-6xl uppercase tracking-tighter mb-6">
            Built for every shipping team.
          </h2>

          <p className="text-muted-foreground text-lg">
            From solo course creators to broadcasting platforms — one pipeline
            scales with you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="bg-background p-8 hover:bg-white/[0.03] transition-colors group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="text-[10px] font-mono uppercase tracking-widest text-primary">
                  {useCase.tag}
                </div>

                <div className="size-6 rounded-full border border-white/10 grid place-items-center text-white/40 group-hover:text-primary group-hover:border-primary transition-colors">
                  →
                </div>
              </div>

              <h3 className="font-display text-2xl uppercase mb-3">
                {useCase.title}
              </h3>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {useCase.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UseCasesSection;