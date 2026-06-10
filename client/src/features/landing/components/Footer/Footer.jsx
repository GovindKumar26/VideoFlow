function Footer() {
  const links = [
    "Terms",
    "Privacy",
    "Security",
    "System Status",
  ];

  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-display text-lg tracking-tighter uppercase text-white/40">
            Videoflow
          </span>

          <span className="text-[10px] font-mono text-muted-foreground uppercase mt-1">
            © 2026 Media Ops Inc.
          </span>
        </div>

        <div className="flex gap-8 text-xs font-medium text-muted-foreground">
          {links.map((link) => (
            <a
              key={link}
              href="#"
              className="hover:text-foreground"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;