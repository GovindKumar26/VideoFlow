function NetworkSection() {
  const stats = [
    {
      value: "12.4PB",
      label: "Data Streamed",
    },
    {
      value: "99.99%",
      label: "Uptime SLA",
    },
    {
      value: "42ms",
      label: "Avg Latency",
    },
    {
      value: "180+",
      label: "Edge Regions",
    },
  ];

  return (
    <section id="network" className="py-20 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="font-display text-4xl md:text-5xl uppercase tracking-tighter">
              {stat.value}
            </div>

            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-2">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NetworkSection;