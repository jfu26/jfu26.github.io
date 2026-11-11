import type { Metadata } from "next";
import CvList, { education, experience } from "@/components/CvList";
import PrintButton from "@/components/PrintButton";
import { profile } from "@/lib/content";

export const metadata: Metadata = { title: "CV", description: `Curriculum vitae of ${profile.name}.` };

export default function CvPage() {
  const updated = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return (
    <article className="cv">
      <header className="cv-header">
        <div>
          <h1 className="page-heading">{profile.name}</h1>
          <p className="position">{profile.role}<br />{profile.affiliation}, {profile.location}</p>
          <p className="contact-links">
            <a href="https://jfu26.github.io">jfu26.github.io</a>
            {profile.links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
          </p>
        </div>
        <PrintButton />
      </header>

      <section className="page-section"><h2>Education</h2><CvList entries={education(profile.education)} /></section>
      <section className="page-section"><h2>Research interests</h2><p>{profile.interests.map((x, i) => (i ? x.toLowerCase() : x)).join(", ")}.</p></section>
      <section className="page-section"><h2>Professional experience</h2><CvList entries={experience(profile.experience)} /></section>
      <p className="muted cv-updated">Last updated {updated}.</p>
    </article>
  );
}
