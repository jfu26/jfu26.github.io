"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  ["Research", "/research/"],
  ["Notes", "/notes/"],
  ["Data", "/macro/"],
  ["CV", "/cv/"],
];

export default function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">Skip to content</a>
      <Link className="site-name" href="/">J. Fu</Link>
      <nav aria-label="Primary">
        {navigation.map(([label, href]) => (
          <Link href={href} key={href} aria-current={pathname.startsWith(href.slice(0, -1)) ? "page" : undefined}>{label}</Link>
        ))}
      </nav>
    </header>
  );
}
