import Link from "next/link";
import { profile } from "@/lib/content";

export default function Home() {
  return (
    <section className="about">
      <h1>{profile.name}</h1>
      <p className="position">{profile.role}<br />{profile.affiliation}</p>
      <p>{profile.bio}</p>
      <p><strong>Research interests:</strong> {profile.interests.map((x, i) => (i ? x.toLowerCase() : x)).join(", ")}.</p>
      <p className="contact-links">
        <Link href="/cv/">CV</Link>
        {profile.links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
      </p>
    </section>
  );
}
