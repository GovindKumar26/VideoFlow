function NavLinks() {
  const links = [
    {
      label: "Platform",
      href: "#platform",
    },
    {
      label: "Studio",
      href: "#studio",
    },
    {
      label: "Security",
      href: "#security",
    },
    {
      label: "Use Cases",
      href: "#use-cases",
    },
    {
      label: "Network",
      href: "#network",
    },
    {
      label: "Developers",
      href: "#developers",
    },
    {
      label: "Pricing",
      href: "#pricing",
    },
  ];

  return (
    <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          className="hover:text-foreground transition-colors"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export default NavLinks;