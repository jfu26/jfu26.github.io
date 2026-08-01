import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getPosts } from "@/lib/content";

export default function Home() {
  const posts = getPosts().slice(0, 3);
  return (
    <main className="site-shell">
      <SiteHeader />

      <section className="intro" aria-labelledby="intro-title">
        <p className="overline">Economics · Geneva</p>
        <h1 id="intro-title">J. Fu</h1>
        <p className="intro-role">
          Incoming PhD student in Economics at the Geneva Graduate Institute
          (IHEID), beginning September 2026.
        </p>
        <p className="intro-copy">
          I am interested in macroeconomics, expectations, institutions, and
          international economic linkages. My research agenda is currently in development.
        </p>
        <p className="research-equation">
          {String.raw`\(\mathbb{E}_t[x_{t+1}\mid\mathcal I_t]\)`}
          <span>beliefs, states, and aggregate outcomes</span>
        </p>
      </section>

      <section className="plain-section">
        <h2>Research</h2>
        <div className="section-body">
          <ul className="direct-list">
            <li><Link href="/research">Research interests and agenda</Link><span>Overview ↗</span></li>
            <li><Link href="/publications">Publications</Link><span>BibTeX / DOI</span></li>
            <li><Link href="/posts">Research notes and notebooks</Link><span>Markdown / Jupyter / R</span></li>
          </ul>
        </div>
      </section>

      <section className="plain-section" id="education">
        <h2>Education</h2>
        <div className="section-body">
          <ol className="dated-list">
            <li><time>2026–</time><div><strong>PhD in Economics</strong><span>Geneva Graduate Institute (IHEID)</span></div></li>
            <li><time>2026–27</time><div><strong>Beginning Doctoral Program</strong><span>Study Center Gerzensee, Switzerland · Aug 2026–Aug 2027</span></div></li>
          </ol>
        </div>
      </section>

      <section className="plain-section">
        <h2>Recent posts</h2>
        <div className="section-body">
          <ul className="entry-list">
            {posts.map((post) => (
              <li key={post.slug}>
                <div><Link href={`/posts/${post.slug}`}>{post.title}</Link><p>{post.summary}</p></div>
                <time>{post.date}</time>
              </li>
            ))}
          </ul>
          <Link className="more-link" href="/posts">All posts →</Link>
        </div>
      </section>

      <section className="plain-section">
        <h2>Data</h2>
        <div className="section-body">
          <div className="project-row">
            <div><h3>Global Macro Atlas</h3><p>Interactive country-level data from IMF WEO, Global Macro Database, and DBnomics.</p></div>
            <Link href="/macro">Open atlas ↗</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
