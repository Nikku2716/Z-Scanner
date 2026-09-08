import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const scanModes = [
  { mode: 'Quick', scope: '5 pages', icon: 'bolt', copy: 'Targeted surface triage for fast CI/CD pull request gate checks.' },
  { mode: 'Fast', scope: '20 pages', icon: 'speed', copy: 'Balanced crawler for dynamic microservices, staging environments, and single-page apps.' },
  { mode: 'Deep', scope: '100 pages', icon: 'account_tree', copy: 'Thorough recursive crawler mapping hidden routes, forms, and parameter attack vectors.' },
  { mode: 'Stealth', scope: '10 pages', icon: 'visibility_off', copy: 'Low-frequency, rate-limited requests engineered for sensitive production assets.' },
];

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const capabilitiesRef = useRef<HTMLDivElement>(null);
  const modesRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current.querySelectorAll('[data-hero-item]'),
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }
        );
      }

      [capabilitiesRef, modesRef, architectureRef].forEach((sectionRef) => {
        if (!sectionRef.current) return;
        gsap.fromTo(
          sectionRef.current.children,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.07,
            ease: 'power2.out',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
      });

      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            scrollTrigger: { trigger: ctaRef.current, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="landing" ref={containerRef}>
      <nav className="landing__nav" aria-label="Main navigation">
        <div className="landing__nav-inner">
          <Link to="/" className="landing__brand" aria-label="BlackHawk home">
            <span className="landing__brand-icon material-symbols-outlined">
              radar
            </span>
            <span className="landing__brand-text">
              BlackHawk
            </span>
          </Link>
          <div className="landing__nav-links">
            <a href="#capabilities">Capabilities</a>
            <a href="#modes">Profiles</a>
            <a href="#architecture">Architecture</a>
            <Link to="/dashboard">Dashboard</Link>
          </div>
          <Link to="/scan/new" className="landing__nav-cta">
            <span>New Scan</span>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="landing__hero" ref={heroRef}>
          <div className="landing__hero-copy">
            <p className="landing__eyebrow" data-hero-item>
              <span /> Automated AppSec Telemetry
            </p>
            <h1 data-hero-item>
              High-precision web security <em>crystallized into action.</em>
            </h1>
            <p className="landing__hero-description" data-hero-item>
              BlackHawk arms security engineers and developers with real-time attack surface discovery, OWASP ZAP telemetry, and risk-ranked vulnerability intelligence.
            </p>
            <div data-hero-item style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/scan/new" className="landing__button landing__button--primary">
                <span>Launch New Scan</span>
                <span className="material-symbols-outlined">rocket_launch</span>
              </Link>
              <Link to="/dashboard" className="landing__button landing__button--ghost">
                <span>Open Dashboard</span>
                <span className="material-symbols-outlined">dashboard</span>
              </Link>
            </div>
            <dl className="landing__hero-facts" data-hero-item>
              <div>
                <dt>Engine</dt>
                <dd>OWASP ZAP 2.15</dd>
              </div>
              <div>
                <dt>Coverage</dt>
                <dd>OWASP Top 10 + API</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>JSON · HTML · Telemetry</dd>
              </div>
            </dl>
          </div>

          {/* Stationary Observatory Preview */}
          <div className="landing__observatory" data-hero-item aria-label="Security observatory telemetry preview">
            <div className="landing__observatory-topline">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: 'var(--landing-lavender)' }}>sensors</span>
                LIVE INSPECTION MONITOR
              </span>
              <span className="landing__live-state">
                <i /> Active Node
              </span>
            </div>

            <div className="landing__target">
              <div style={{ background: 'rgba(124, 58, 237, 0.12)', padding: '7px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--landing-accent)', fontSize: '20px' }}>shield</span>
              </div>
              <div>
                <small>TARGET HOST</small>
                <strong>https://api.payments.studio</strong>
              </div>
              <span className="landing__target-status">INSPECTING</span>
            </div>

            <div className="landing__signal-map">
              <div className="landing__map-head">
                <span>ATTACK SURFACE CRAWLER</span>
                <span>48 routes mapped</span>
              </div>
              <div className="landing__map-lines" aria-hidden="true">
                <i title="Checked: /v1/auth" />
                <i title="Checked: /checkout" />
                <i title="Checked: /api/keys" />
                <i title="Checked: /users" />
                <i title="Checked: /graphql" />
                <i title="Checked: /oauth/callback" />
              </div>
              <div className="landing__map-key">
                <span><i style={{ background: 'var(--landing-accent)' }} /> High Confidence</span>
                <span><i style={{ background: 'var(--color-success-green)' }} /> Clean Route</span>
                <span><i style={{ background: 'var(--color-muted-gray)' }} /> Passive Spider</span>
              </div>
            </div>

            <div className="landing__finding-row">
              <div>
                <span>CRITICAL / HIGH RISKS</span>
                <strong>02</strong>
                <small>CORS &amp; JWT Exposure</small>
              </div>
              <div>
                <span>SECURITY HEALTH INDEX</span>
                <strong style={{ color: 'var(--color-success-green)' }}>88</strong>
                <small>Grade A- (Hardened)</small>
              </div>
            </div>

            <div className="landing__observatory-foot">
              <span>SCAN ID: #sc-8941a</span>
              <span>TELEMETRY: WEBSOCKET 100 FPS</span>
            </div>
          </div>
        </section>

        {/* Stack Proof Strip */}
        <section className="landing__proof" aria-label="Platform foundations">
          <span>Engineered with modern tools</span>
          <div>
            <span>OWASP ZAP</span>
            <span>React 18</span>
            <span>TypeScript</span>
            <span>Go Orchestrator</span>
            <span>Docker</span>
            <span>Vite</span>
          </div>
        </section>

        {/* Capabilities */}
        <section className="landing__section landing__section--surface" id="capabilities">
          <div className="landing__section-intro">
            <p className="landing__eyebrow"><span /> Core Architecture</p>
            <h2>Built for decisive vulnerability triage.</h2>
            <p>Every feature in BlackHawk is calibrated to turn raw spider findings into clear, developer-actionable remediation tasks.</p>
          </div>
          <div className="landing__capability-grid" ref={capabilitiesRef}>
            <article className="landing__capability landing__capability--wide">
              <div className="landing__capability-icon">
                <span className="material-symbols-outlined" style={{ color: 'var(--landing-lavender)' }}>account_tree</span>
              </div>
              <p className="landing__capability-label">Reconnaissance</p>
              <h3>Interactive Attack Surface Visualization</h3>
              <p>Passive and active crawler engines trace routes, forms, headers, and authentication flows into an organized tree topology.</p>
              <div className="landing__route-list" aria-hidden="true">
                <span>POST /v1/auth/token</span>
                <span>GET /api/v2/orders</span>
                <span>PUT /admin/settings</span>
                <span>GET /.well-known/jwks.json</span>
              </div>
            </article>

            <article className="landing__capability landing__capability--copper">
              <div className="landing__capability-icon">
                <span className="material-symbols-outlined" style={{ color: 'var(--landing-accent)' }}>verified_user</span>
              </div>
              <p className="landing__capability-label">Evidence Verification</p>
              <h3>Proof-Backed Alert Ranking</h3>
              <p>Eliminate alert fatigue with verified reproduction steps, CWE IDs, OWASP references, and automated curl payloads.</p>
            </article>

            <article className="landing__capability landing__capability--dark">
              <div className="landing__capability-icon">
                <span className="material-symbols-outlined" style={{ color: 'var(--landing-lavender)' }}>difference</span>
              </div>
              <p className="landing__capability-label">Drift Tracking</p>
              <h3>Differential Scan Comparison</h3>
              <p>Compare consecutive scan runs to verify newly resolved issues and catch regressions before production deployments.</p>
            </article>
          </div>
        </section>

        {/* Scan Profiles */}
        <section className="landing__section landing__profiles" id="modes">
          <div className="landing__section-intro landing__section-intro--split">
            <div>
              <p className="landing__eyebrow"><span /> Flexible Workflows</p>
              <h2>Configured for every development phase.</h2>
            </div>
            <p>From sub-minute pull request audits to full recursive penetration benchmarks, select the footprint that matches your operational needs.</p>
          </div>
          <div className="landing__profiles-list" ref={modesRef}>
            {scanModes.map((scanMode, index) => (
              <article className="landing__profile" key={scanMode.mode}>
                <span className="landing__profile-index">0{index + 1}</span>
                <span className="material-symbols-outlined landing__profile-icon">{scanMode.icon}</span>
                <div>
                  <h3>{scanMode.mode} Scan</h3>
                  <p>{scanMode.copy}</p>
                </div>
                <span className="landing__profile-scope">{scanMode.scope}</span>
              </article>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="landing__section landing__section--surface" id="architecture">
          <div className="landing__section-intro">
            <p className="landing__eyebrow"><span /> Resilient Pipeline</p>
            <h2>Three robust layers. Zero black boxes.</h2>
          </div>
          <div className="landing__architecture" ref={architectureRef}>
            <article>
              <span>01 / CLIENT</span>
              <div className="landing__architecture-icon">
                <span className="material-symbols-outlined" style={{ color: 'var(--landing-lavender)' }}>dashboard</span>
              </div>
              <h3>Obsidian Workspace</h3>
              <p>Low-latency dark console with live stream logs, surface graphing, and exportable security reports.</p>
            </article>
            <article>
              <span>02 / ENGINE</span>
              <div className="landing__architecture-icon">
                <span className="material-symbols-outlined" style={{ color: 'var(--landing-accent)' }}>memory</span>
              </div>
              <h3>Go Orchestrator</h3>
              <p>High-throughput concurrent backend handling job queuing, persistent storage, and WebSocket streaming.</p>
            </article>
            <article>
              <span>03 / CORE</span>
              <div className="landing__architecture-icon">
                <span className="material-symbols-outlined" style={{ color: 'var(--color-success-green)' }}>security</span>
              </div>
              <h3>OWASP ZAP Engine</h3>
              <p>Industry-standard scanning daemon evaluating active injection vectors and passive header vulnerabilities.</p>
            </article>
          </div>
        </section>

        {/* Final CTA */}
        <section className="landing__final-cta" ref={ctaRef}>
          <div>
            <p className="landing__eyebrow"><span /> Get Started</p>
            <h2>Ready to fortify your web application?</h2>
          </div>
          <Link to="/scan/new" className="landing__button landing__button--primary">
            <span>Start Scanning Now</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </section>
      </main>

      <footer className="landing__footer">
        <span>
          <strong>BlackHawk</strong>
          <i>·</i>
          Automated Web Application Security Scanner
        </span>
        <div>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/capabilities">Capabilities</Link>
          <Link to="/compare">Compare</Link>
          <Link to="/scan/new">New Scan</Link>
        </div>
      </footer>
    </div>
  );
}
