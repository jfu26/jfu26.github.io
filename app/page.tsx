import Link from "next/link";

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  return (
    <main className="site-shell">
      <header className="plain-header">
        <Link className="site-name" href="/">J. Fu</Link>
        <nav aria-label="Primary navigation">
          <a href="#research">Research</a>
          <a href="#education">Education</a>
          <Link href="/macro">Macro Atlas</Link>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="overline">Economics · Geneva</p>
        <h1 id="intro-title">J. Fu</h1>
        <p className="intro-role">
          Incoming PhD student in Economics at the Geneva Graduate Institute
          (IHEID), beginning September 2026.
        </p>
        <p className="intro-copy">
          I am interested in macroeconomics, expectations, institutions, and
          international economic linkages. My research agenda is currently in
          development.
        </p>
        <p className="research-equation" aria-label="Expected future state conditional on current information">
          {String.raw`\(\mathbb{E}_t[x_{t+1}\mid\mathcal{I}_t]\)`}
          <span>beliefs, states, and aggregate outcomes</span>
        </p>
      </section>

      <section className="plain-section" id="research">
        <h2>Research</h2>
        <div className="section-body">
          <p className="section-intro">
            Current interests. Papers, notes, and replication materials will be
            added as the work develops.
          </p>
          <ul className="text-list">
            <li>
              <span>Expectations and aggregate dynamics</span>
              <span className="list-math">{String.raw`\(x_t=T(\mathbb{E}_t x_{t+1})\)`}</span>
            </li>
            <li>
              <span>Institutions and policy</span>
              <span className="list-math">{String.raw`\(V(s)=\max_a\{u(s,a)+\beta\,\mathbb{E}V(s')\}\)`}</span>
            </li>
            <li>
              <span>International macroeconomics</span>
              <span className="list-math">{String.raw`\(Y=C+I+G+NX\)`}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="plain-section" id="education">
        <h2>Education</h2>
        <div className="section-body">
          <ol className="dated-list">
            <li>
              <time>2026–</time>
              <div>
                <strong>PhD in Economics</strong>
                <span>Geneva Graduate Institute (IHEID)</span>
              </div>
            </li>
            <li>
              <time>2026–27</time>
              <div>
                <strong>Beginning Doctoral Program</strong>
                <span>Study Center Gerzensee, Switzerland · Aug 2026–Aug 2027</span>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="plain-section">
        <h2>Data</h2>
        <div className="section-body">
          <div className="project-row">
            <div>
              <h3>Global Macro Atlas</h3>
              <p>
                Interactive country-level macroeconomic data from IMF WEO,
                Global Macro Database, and DBnomics.
              </p>
            </div>
            <Link href="/macro">Open atlas <Arrow /></Link>
          </div>
        </div>
      </section>

      <footer className="plain-footer" id="contact">
        <span>J. Fu · Geneva, Switzerland</span>
        <span>CV and contact details forthcoming.</span>
      </footer>
    </main>
  );
}
