import Link from "next/link";
import { getPosts, profile } from "@/lib/content";

type Entry = { period: string; heading: string; place: string; detail?: string };

function Timeline({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <section className="cv-section" aria-labelledby={title}>
      <h2 id={title}>{title}</h2>
      <ol className="timeline">
        {entries.map((entry) => (
          <li key={entry.heading + entry.period}>
            <time>{entry.period}</time>
            <div>
              <strong>{entry.heading}</strong>
              <span>{entry.place}</span>
              {entry.detail && <small>{entry.detail}</small>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Home() {
  const posts = getPosts().slice(0, 3);
  return (
    <>
      <section className="profile" aria-labelledby="name">
        <div>
          <h1 id="name">{profile.name}</h1>
          <p className="profile-role">{profile.role}<br />{profile.affiliation}</p>
          <p className="profile-bio">{profile.bio}</p>
          <p className="profile-links">
            {profile.links.map((link) => <a key={link.href} href={link.href}>{link.label} ↗</a>)}
            <Link href="/research/">Research agenda →</Link>
          </p>
        </div>
        <aside className="interests" aria-label="Research interests">
          <h2>Research interests</h2>
          <ul>{profile.interests.map((interest) => <li key={interest}>{interest}</li>)}</ul>
          <p className="interest-math">{String.raw`\(\pi_t=\beta\,\mathbb{E}_t\pi_{t+1}+\kappa x_t\)`}</p>
        </aside>
      </section>

      <Timeline
        title="Education"
        entries={profile.education.map((e) => ({ period: e.period, heading: e.degree, place: e.institution, detail: e.detail }))}
      />
      <Timeline
        title="Experience"
        entries={profile.experience.map((e) => ({ period: e.period, heading: e.title, place: e.organization, detail: e.detail }))}
      />

      <section className="cv-section" aria-labelledby="writing">
        <h2 id="writing">Recent writing</h2>
        <div>
          <ul className="entry-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <div><Link href={`/posts/${post.slug}/`}>{post.title}</Link><p>{post.summary}</p></div>
                <time>{post.date}</time>
              </li>
            ))}
          </ul>
          <Link className="more-link" href="/posts/">All writing →</Link>
        </div>
      </section>

      <section className="cv-section" aria-labelledby="data">
        <h2 id="data">Data</h2>
        <div className="project-row">
          <div><h3>Global Macro Atlas</h3><p>Interactive country-level data from IMF WEO, the Global Macro Database, and DBnomics.</p></div>
          <Link href="/macro/">Open atlas →</Link>
        </div>
      </section>
    </>
  );
}
