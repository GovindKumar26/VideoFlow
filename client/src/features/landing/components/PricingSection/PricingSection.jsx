function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-24 px-6 border-t border-border"
    >
      <div className="max-w-4xl mx-auto text-center relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(244,63,94,0.15),transparent_60%)]" />

        <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mb-6">
          Ship video. Skip the ops.
        </h2>

        <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
          Offload terabytes of storage, encoding and edge delivery.
          Keep the player. Keep the brand.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="h-12 px-8 bg-white text-black font-semibold rounded-md hover:bg-primary hover:text-white transition-colors text-sm">
            Start free trial
          </button>

          <button className="h-12 px-8 border border-white/10 font-medium rounded-md hover:bg-white/5 transition-colors text-sm">
            Talk to sales
          </button>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;