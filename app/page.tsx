import Link from "next/link";

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  return (
    <main className="home-shell">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="J. Fu, home">
          JF<span>.</span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#research">Research</a>
          <a href="#about">About</a>
          <Link href="/macro">Macro Atlas</Link>
          <a href="#contact">Contact</a>
        </nav>
        <span className="header-place">Geneva · CH</span>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Economics PhD · Incoming 2026</p>
          <h1>
            J. Fu
            <span>Economist in formation.</span>
          </h1>
          <p className="hero-intro">
            Incoming doctoral researcher in Economics at the Geneva Graduate
            Institute, interested in how expectations, institutions, and
            global linkages shape economic outcomes.
          </p>
          <div className="hero-links">
            <a href="#research">View research notes <span>↓</span></a>
            <Link href="/macro">Explore macro data <Arrow /></Link>
          </div>
        </div>

        <div className="phase-field" aria-label="A stylized economic phase diagram">
          <span className="axis axis-x">state, x</span>
          <span className="axis axis-y">belief, E<sub>t</sub>x<sub>t+1</sub></span>
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="equilibrium">
            <i />
            <span>x<sup>*</sup></span>
          </div>
          <p className="field-note">
            equilibrium as a fixed point
            <br />
            x<sup>*</sup> = T(x<sup>*</sup>)
          </p>
        </div>

        <div className="hero-index" aria-hidden="true">01 / 04</div>
      </section>

      <section className="coordinates" id="about">
        <div className="section-label">
          <span>Current coordinates</span>
          <small>46.2044° N, 6.1432° E</small>
        </div>
        <div className="coordinate-grid">
          <article>
            <p className="date">Sep 2026</p>
            <h2>PhD in Economics</h2>
            <p>Geneva Graduate Institute (IHEID)</p>
            <span className="status">Incoming</span>
          </article>
          <article>
            <p className="date">Aug 2026 — Aug 2027</p>
            <h2>Beginning Doctoral Program</h2>
            <p>Study Center Gerzensee, Switzerland</p>
            <span className="status">Cohort 2026</span>
          </article>
        </div>
      </section>

      <section className="research-section" id="research">
        <div className="section-label">
          <span>Research</span>
          <small>Agenda in development</small>
        </div>
        <div className="research-lead">
          <h2>Questions before answers.</h2>
          <p>
            This space will host working papers, research notes, and replication
            materials. For now, it records the questions and tools that will
            guide the work ahead.
          </p>
        </div>
        <div className="research-grid">
          <article>
            <span className="note-no">I</span>
            <h3>Expectations</h3>
            <p>How do beliefs propagate through aggregate dynamics?</p>
            <code>E<sub>t</sub>[x<sub>t+1</sub>] = ∫x dF<sub>t</sub>(x)</code>
          </article>
          <article>
            <span className="note-no">II</span>
            <h3>Institutions</h3>
            <p>When do rules discipline policy, and when do they bind?</p>
            <code>V(s) = max<sub>a</sub> &#123;u(s,a) + βEV(s&apos;)&#125;</code>
          </article>
          <article>
            <span className="note-no">III</span>
            <h3>Global linkages</h3>
            <p>What travels across borders, and what remains local?</p>
            <code>Y = C + I + G + NX</code>
          </article>
        </div>
      </section>

      <section className="atlas-callout">
        <div>
          <p className="eyebrow">Open data experiment · 02</p>
          <h2>A living view of the world economy.</h2>
        </div>
        <p>
          Compare growth, inflation, and public debt across countries using
          open macroeconomic sources. Data are fetched on demand and never
          stored in this repository.
        </p>
        <Link href="/macro" className="round-link" aria-label="Open Macro Atlas">
          <Arrow />
        </Link>
      </section>

      <footer id="contact">
        <div>
          <span>J. Fu</span>
          <p>Economics · Geneva</p>
        </div>
        <p className="footer-note">Full biography, CV, and contact details forthcoming.</p>
        <a href="mailto:email@forthcoming.example">Email forthcoming <Arrow /></a>
      </footer>
    </main>
  );
}
