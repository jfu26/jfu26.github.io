import Link from "next/link";

const navigation = [
  ["Research", "/research"],
  ["Publications", "/publications"],
  ["Posts", "/posts"],
  ["Macro Atlas", "/macro"],
];

export default function SiteHeader() {
  return (
    <header className="plain-header">
      <Link className="site-name" href="/">J. Fu</Link>
      <nav aria-label="Primary navigation">
        {navigation.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
      </nav>
    </header>
  );
}
