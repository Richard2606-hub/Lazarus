"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppHeader({ section }: { section?: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/graveyard", label: "Graveyard" },
    { href: "/necromancer", label: "Necromancer" },
    { href: "/verification", label: "Verification" },
  ];

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Lazarus home">
        <span className="brand-mark" aria-hidden="true">L</span>
        <span>
          <strong>Lazarus</strong>
          <small>{section ?? "Research intelligence"}</small>
        </span>
      </Link>
      <nav className="main-nav" aria-label="Primary navigation">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
