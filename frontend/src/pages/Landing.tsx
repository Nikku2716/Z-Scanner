import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TERMINAL_SCRIPT = [
  'blackhawk scan --target https://corp.internal --mode deep',
  '[INFO] Spider engaged — mapping 48 entry points & query parameters…',
  '[INFO] Active fuzzing engine initialized with OWASP Top 10 rules',
  '[WARN] CORS wildcard access-control-allow-origin at /api/telemetry',
  '[HIGH] Reflected XSS verified at /search?q=<script>',
  '[HIGH] Blind SQL injection confirmed at /api/v1/auth/login',
  '[DONE] Scan complete — 2 High · 3 Medium · 9 Low · 0 False Positives',
];

const AVATARS = [
  { icon: 'shield_person', border: 'blue', label: 'Security Lead' },
  { icon: 'terminal', border: 'coral', label: 'DevOps Engineer' },
  { icon: 'smart_toy', border: 'yellow', label: 'Autonomous Agent' },
  { icon: 'bug_report', border: 'sky', label: 'Penetration Tester' },
  { icon: 'psychology', border: 'midnight', label: 'AppSec Analyst' },
  { icon: 'code', border: 'coral', label: 'Full Stack Dev' },
  { icon: 'verified', border: 'blue', label: 'Compliance Auditor' },
];

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLDivElement>(null);
  const mosaicRef = useRef<HTMLDivElement>(null);
  const whiteGridRef = useRef<HTMLDivElement>(null);
  const modesRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let timer: number;

    const ctx = gsap.context(() => {
      // Hero entrance
      if (heroRef.current) {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        tl.fromTo(
          '.landing__avatar-row',
          { opacity: 0, scale: 0.9, y: 16 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' },
          0.05
        )
          .fromTo(
            '.landing__hero-headline',
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.6 },
            0.15
          )
          .fromTo(
            '.landing__hero-subhead, .landing__hero-cta-row',
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 },
            '-=0.2'
          )
          .fromTo(
            '.landing__mockup-card',
            { opacity: 0, y: 32 },
            { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
            '-=0.2'
          );
      }

      if (!prefersReduced && typedRef.current) {
        let lineIndex = 0;
        let charIndex = 0;

        const typeNextChar = () => {
          const el = typedRef.current;
          if (!el) return;
          const line = TERMINAL_SCRIPT[lineIndex];
          el.textContent = line.slice(0, ++charIndex);

          if (charIndex < line.length) {
            timer = window.setTimeout(typeNextChar, line.startsWith('blackhawk') ? 30 : 18);
          } else {
            timer = window.setTimeout(() => {
              charIndex = 0;
              lineIndex = (lineIndex + 1) % TERMINAL_SCRIPT.length;
              typeNextChar();
            }, 2600);
          }
        };
        timer = window.setTimeout(typeNextChar, 1000);
      }

      if (prefersReduced) return;

      // Scroll reveals for sections
      if (mosaicRef.current) {
        gsap.fromTo(
          mosaicRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: mosaicRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      if (whiteGridRef.current) {
        gsap.fromTo(
          whiteGridRef.current.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: whiteGridRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      if (modesRef.current) {
        gsap.fromTo(
          modesRef.current.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: modesRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      if (archRef.current) {
        gsap.fromTo(
          archRef.current.children,
          { opacity: 0, y: 16 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: archRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, containerRef);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  return (
    <div className="landing" ref={containerRef}>
      {/* ─── Fixed 64px Sticky Navigation Bar ─── */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <Link to="/" className="landing__brand-link" aria-label="BlackHawk Home">
            <span className="landing__brand-mark">B</span>
            <span className="landing__brand-title">
              Black<span className="landing__brand-title-sub">Hawk</span>
            </span>
          </Link>

          <div className="landing__nav-links">
            <a href="#workspace" className="landing__nav-link">Workspace</a>
            <a href="#features" className="landing__nav-link">Capabilities</a>
            <a href="#modes" className="landing__nav-link">Scan Modes</a>
            <a href="#architecture" className="landing__nav-link">Architecture</a>
          </div>

          <div className="landing__nav-actions">
            <Link to="/capabilities" className="landing__nav-btn-demo">
              Documentation
            </Link>
            <Link to="/scan/new" className="landing__nav-cta">
              Launch Scanner
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section (Centered Stack) ─── */}
      <section className="landing__hero" ref={heroRef}>
        {/* 7-Avatar Character Mark Row */}
        <div className="landing__avatar-row" aria-label="Collaborative roles">
          {AVATARS.map((av, idx) => (
            <div
              key={idx}
              className={`landing__avatar-mark landing__avatar-mark--${av.border}`}
              title={av.label}
              aria-label={av.label}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                {av.icon}
              </span>
            </div>
          ))}
        </div>

        {/* Hero Headline with Embedded Highlight Pill */}
        <h1 className="landing__hero-headline">
          Where security and teams{' '}
          <span className="landing__highlight-pill">Scan</span> together.
        </h1>

        {/* Editorial Subhead at 18px Lyon Text */}
        <p className="landing__hero-subhead">
          A calm, tactile vulnerability scanner under afternoon sun. Automated spider crawling,
          zero-day parameter fuzzing, and real-time OWASP risk classification — organized like your favorite notebook.
        </p>

        {/* Two-Button CTA Row */}
        <div className="landing__hero-cta-row">
          <Link to="/scan/new" className="landing__btn-primary">
            Start Live Scan
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>radar</span>
          </Link>
          <Link to="/dashboard" className="landing__btn-ghost-cta">
            Open Workspace Console →
          </Link>
        </div>

        {/* Large Centered Product UI Mockup */}
        <div className="landing__mockup-wrapper" id="workspace">
          <div className="landing__mockup-card">
            {/* Window Header */}
            <div className="landing__mockup-header">
              <div className="landing__mockup-dots">
                <span className="landing__mockup-dot landing__mockup-dot--red" />
                <span className="landing__mockup-dot landing__mockup-dot--amber" />
                <span className="landing__mockup-dot landing__mockup-dot--green" />
              </div>
              <div className="landing__mockup-breadcrumbs">
                <span>Workspace</span>
                <span>/</span>
                <span>BlackHawk Security</span>
                <span>/</span>
                <strong>Production API Audit</strong>
              </div>
              <div className="landing__mockup-tabs">
                <span className="landing__mockup-tab landing__mockup-tab--active">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>view_kanban</span>
                  Board
                </span>
                <span className="landing__mockup-tab">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>table_rows</span>
                  Table
                </span>
                <span className="landing__mockup-tab">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>terminal</span>
                  Stream
                </span>
              </div>
            </div>

            {/* Mockup Body: Kanban Task Cards */}
            <div className="landing__mockup-body">
              <div className="landing__kanban-grid">
                {/* Column 1: Spider Queue */}
                <div className="landing__kanban-col">
                  <div className="landing__kanban-col-header">
                    <span className="landing__kanban-col-title">
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-notion-blue)' }}>hub</span>
                      Spider Discovered
                    </span>
                    <span className="landing__kanban-col-count">14</span>
                  </div>

                  <div className="landing__task-card">
                    <div className="landing__task-header">
                      <span className="landing__task-pill landing__task-pill--clean">DISCOVERED</span>
                      <span style={{ fontSize: '12px' }}>⚡</span>
                    </div>
                    <div className="landing__task-title">/api/v2/user/profile</div>
                    <div className="landing__task-meta">GET · 4 query params mapped</div>
                  </div>

                  <div className="landing__task-card">
                    <div className="landing__task-header">
                      <span className="landing__task-pill landing__task-pill--clean">DISCOVERED</span>
                      <span style={{ fontSize: '12px' }}>🔒</span>
                    </div>
                    <div className="landing__task-title">/oauth/v2/authorize</div>
                    <div className="landing__task-meta">POST · CSRF token verified</div>
                  </div>
                </div>

                {/* Column 2: Active Fuzzing */}
                <div className="landing__kanban-col">
                  <div className="landing__kanban-col-header">
                    <span className="landing__kanban-col-title">
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-marigold)' }}>sync</span>
                      Active Fuzzing
                    </span>
                    <span className="landing__kanban-col-count">3</span>
                  </div>

                  <div className="landing__task-card">
                    <div className="landing__task-header">
                      <span className="landing__task-pill landing__task-pill--med">IN PROGRESS</span>
                      <span style={{ fontSize: '12px' }}>🔄</span>
                    </div>
                    <div className="landing__task-title">Path Traversal Verification</div>
                    <div className="landing__task-meta">/static/download?file=../../</div>
                  </div>

                  <div className="landing__task-card">
                    <div className="landing__task-header">
                      <span className="landing__task-pill landing__task-pill--med">IN PROGRESS</span>
                      <span style={{ fontSize: '12px' }}>🛡️</span>
                    </div>
                    <div className="landing__task-title">Header Injection Auditing</div>
                    <div className="landing__task-meta">X-Forwarded-Host probe active</div>
                  </div>
                </div>

                {/* Column 3: Confirmed Findings */}
                <div className="landing__kanban-col">
                  <div className="landing__kanban-col-header">
                    <span className="landing__kanban-col-title">
                      <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-vermillion)' }}>warning</span>
                      Confirmed Findings
                    </span>
                    <span className="landing__kanban-col-count">4</span>
                  </div>

                  <div className="landing__task-card">
                    <div className="landing__task-header">
                      <span className="landing__task-pill landing__task-pill--high">HIGH RISK</span>
                      <span style={{ fontSize: '12px' }}>🚨</span>
                    </div>
                    <div className="landing__task-title">Cross-Site Scripting (XSS)</div>
                    <div className="landing__task-meta">/search?q= — Unfiltered reflection</div>
                  </div>

                  <div className="landing__task-card">
                    <div className="landing__task-header">
                      <span className="landing__task-pill landing__task-pill--high">HIGH RISK</span>
                      <span style={{ fontSize: '12px' }}>💥</span>
                    </div>
                    <div className="landing__task-title">SQL Injection Vulnerability</div>
                    <div className="landing__task-meta">/api/v1/auth/login — Error-based payload</div>
                  </div>
                </div>
              </div>

              {/* Mockup Terminal Output */}
              <div className="landing__mockup-terminal">
                <div className="landing__terminal-label">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-notion-blue)' }}>terminal</span>
                  Live Telemetry Output
                </div>
                <div className="landing__typed-line" ref={typedRef}>
                  blackhawk scan --target https://corp.internal --mode deep
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Greyscale Logo Wall (Treated as Typography at 60% Alpha) ─── */}
      <section className="landing__logo-wall" aria-label="Ecosystem compatibility">
        <div className="landing__logo-wall-label">
          Auditing targets across modern developer stacks
        </div>
        <div className="landing__logo-grid">
          <div className="landing__logo-item">
            <span className="material-symbols-outlined">security</span>
            OWASP ZAP 2.15
          </div>
          <div className="landing__logo-item">
            <span className="material-symbols-outlined">deployed_code</span>
            Docker Engine
          </div>
          <div className="landing__logo-item">
            <span className="material-symbols-outlined">code_blocks</span>
            React 18
          </div>
          <div className="landing__logo-item">
            <span className="material-symbols-outlined">terminal</span>
            Go Chi Core
          </div>
          <div className="landing__logo-item">
            <span className="material-symbols-outlined">cloud</span>
            Cloudflare Edge
          </div>
          <div className="landing__logo-item">
            <span className="material-symbols-outlined">database</span>
            SQLite Store
          </div>
        </div>
      </section>

      {/* ─── 2×2 Feature Section ("Ask your on-demand assistants" style) ─── */}
      <section className="landing__section" id="features">
        <div className="landing__section-header">
          <h2 className="landing__section-title">Organized for clarity. Engineered for depth.</h2>
          <p className="landing__section-subhead">
            Notion-grade documentation combined with an industry-standard security engine.
          </p>
        </div>

        <div className="landing__feature-mosaic" ref={mosaicRef}>
          {/* Top Card: Full-width Accent Feature Card in Marigold */}
          <div className="landing__mosaic-full">
            <div>
              <span className="badge" style={{ background: '#ffffff', color: '#000000', marginBottom: '1rem', border: 'none' }}>
                SPARSE PUNCTUATION
              </span>
              <h3 className="landing__mosaic-title">
                Zero Noise. Every finding categorized like a ruled section.
              </h3>
              <p className="landing__mosaic-desc">
                BlackHawk stays quiet until actionable vulnerabilities are verified. Receive clean,
                risk-ranked evidence without pages of false alarms cluttering your workspace.
              </p>
              <Link to="/scan/new" className="landing__btn-primary" style={{ background: '#000000', borderColor: '#000000' }}>
                Try Deep Scan
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </Link>
            </div>

            {/* Task Card Preview inside colored block */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow-product-mockup)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-notioninter)', fontSize: '12px', fontWeight: 600, color: 'rgba(0,0,0,0.6)' }}>
                  SUMMARY REPORT
                </span>
                <span className="landing__task-pill landing__task-pill--clean">READY</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: '#000000' }}>
                38 Endpoints Audited · Zero Latency
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-graphite)', lineHeight: 1.45, margin: 0 }}>
                OWASP Top 10 rules verified directly on your local runtime. Export as structured JSON or styled HTML in one click.
              </p>
            </div>
          </div>

          {/* Bottom Split Row: Sky Tint Card + Midnight Ink Dark Feature Card */}
          <div className="landing__mosaic-split">
            {/* Bottom-left: Sky Tint Accent Card */}
            <div className="landing__mosaic-col--sky">
              <div className="landing__white-card-icon landing__white-card-icon--sky">
                <span className="material-symbols-outlined" style={{ color: 'var(--color-notion-blue)' }}>
                  cell_tower
                </span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px', color: '#000000', letterSpacing: '-0.3px' }}>
                Real-Time Telemetry Stream
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-graphite)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Live spider discovery and active parameter fuzzing streamed via WebSockets. Watch attack surfaces map in real time.
              </p>
              <Link to="/capabilities" className="landing__nav-btn-demo">
                View WebSocket Spec →
              </Link>
            </div>

            {/* Bottom-right: Midnight Ink Dark Feature Card (Dark Mode Island) */}
            <div className="landing__mosaic-col--midnight">
              <div className="landing__white-card-icon" style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                <span className="material-symbols-outlined" style={{ color: '#ffffff' }}>
                  terminal
                </span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.3px' }}>
                Dark Mode Island · Audit Terminal
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                A high-contrast audit window embedded in your paper notebook. Inspect raw HTTP request payloads, parameter mutations, and server headers.
              </p>
              <Link to="/scan/new" style={{ color: '#ffffff', textDecoration: 'underline', textUnderlineOffset: '4px', fontSize: '14px', fontWeight: 500 }}>
                Open Terminal Mode →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── White Feature Cards Grid (1px Hairline Borders, No Shadows) ─── */}
      <section className="landing__section">
        <div className="landing__section-header">
          <h2 className="landing__section-title">Tactile features. Enterprise power.</h2>
          <p className="landing__section-subhead">
            Designed with 12px corners and 1px hairline borders like ruled sections in a Moleskine.
          </p>
        </div>

        <div className="landing__white-grid" ref={whiteGridRef}>
          <div className="landing__white-card">
            <div className="landing__white-card-icon">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-signal-blue)' }}>tune</span>
            </div>
            <h3 className="landing__white-card-title">4 Scan Profiles</h3>
            <p className="landing__white-card-desc">
              From 5-page rapid staging checks to 100-page deep spider crawls. Choose the crawl depth and footprint for each stage.
            </p>
          </div>

          <div className="landing__white-card">
            <div className="landing__white-card-icon landing__white-card-icon--coral">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-coral)' }}>shield</span>
            </div>
            <h3 className="landing__white-card-title">OWASP Core Coverage</h3>
            <p className="landing__white-card-desc">
              Audits SQL Injection, XSS, SSRF, header misconfigurations, and path traversal with OWASP ZAP 2.15 engine rules.
            </p>
          </div>

          <div className="landing__white-card">
            <div className="landing__white-card-icon landing__white-card-icon--marigold">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-marigold)' }}>filter_alt</span>
            </div>
            <h3 className="landing__white-card-title">Risk-Based Filtering</h3>
            <p className="landing__white-card-desc">
              Instant classification across High, Medium, Low, and Informational tiers to triage critical issues first.
            </p>
          </div>

          <div className="landing__white-card">
            <div className="landing__white-card-icon landing__white-card-icon--sky">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-notion-blue)' }}>download</span>
            </div>
            <h3 className="landing__white-card-title">Dual Audit Exports</h3>
            <p className="landing__white-card-desc">
              Export structured JSON for automated CI/CD gating or download comprehensive HTML reports for stakeholders.
            </p>
          </div>

          <div className="landing__white-card">
            <div className="landing__white-card-icon">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-signal-blue)' }}>hub</span>
            </div>
            <h3 className="landing__white-card-title">Attack Surface Mapping</h3>
            <p className="landing__white-card-desc">
              Inspect full endpoint inventories, HTTP methods, and query parameters discovered during recursive spidering.
            </p>
          </div>

          <div className="landing__white-card">
            <div className="landing__white-card-icon landing__white-card-icon--coral">
              <span className="material-symbols-outlined" style={{ color: 'var(--color-coral)' }}>difference</span>
            </div>
            <h3 className="landing__white-card-title">Scan Comparison & Diff</h3>
            <p className="landing__white-card-desc">
              Diff two scans to verify resolved vulnerabilities and prevent security regressions before production deployments.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Scan Modes Section (Ruled Moleskine Style) ─── */}
      <section className="landing__section" id="modes">
        <div className="landing__section-header">
          <h2 className="landing__section-title">Tailored scan footprints</h2>
          <p className="landing__section-subhead">
            Select the crawl depth that fits your continuous integration lifecycle.
          </p>
        </div>

        <div className="landing__modes-grid" ref={modesRef}>
          {[
            { mode: 'Quick', pages: '5 Pages Max', icon: 'bolt', desc: 'Rapid surface check for immediate feedback during pull request staging.' },
            { mode: 'Fast', pages: '20 Pages Max', icon: 'speed', desc: 'Balanced crawl depth probing common authentication and API routes.' },
            { mode: 'Deep', pages: '100 Pages Max', icon: 'layers', desc: 'Exhaustive recursive spider mapping full enterprise attack surfaces.' },
            { mode: 'Stealth', pages: '10 Pages Max', icon: 'visibility_off', desc: 'Low-frequency requests engineered to minimize firewall alerts.' },
          ].map((m) => (
            <div className="landing__mode-card" key={m.mode}>
              <div className="landing__mode-icon">
                <span className="material-symbols-outlined">{m.icon}</span>
              </div>
              <h3 className="landing__mode-title">{m.mode}</h3>
              <span className="landing__mode-pill">{m.pages}</span>
              <p className="landing__mode-desc">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── System Architecture Section ─── */}
      <section className="landing__section" id="architecture">
        <div className="landing__section-header">
          <h2 className="landing__section-title">Three-tier container architecture</h2>
          <p className="landing__section-subhead">
            Clean separation of presentation, orchestration, and security inspection.
          </p>
        </div>

        <div className="landing__arch-grid" ref={archRef}>
          <div className="landing__arch-node">
            <span className="landing__arch-tag">CLIENT UI</span>
            <div style={{ margin: '0.75rem 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-notion-blue)' }}>
                desktop_windows
              </span>
            </div>
            <h3 className="landing__arch-title">React 18 + Vite</h3>
            <p className="landing__arch-sub">Notion design system, live WebSocket hooks</p>
          </div>

          <div className="landing__arch-arrow">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>

          <div className="landing__arch-node">
            <span className="landing__arch-tag">
              ORCHESTRATOR
            </span>
            <div style={{ margin: '0.75rem 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-notion-blue)' }}>
                dns
              </span>
            </div>
            <h3 className="landing__arch-title">Go Chi Engine</h3>
            <p className="landing__arch-sub">High-concurrency router + SQLite state store</p>
          </div>

          <div className="landing__arch-arrow">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>

          <div className="landing__arch-node">
            <span className="landing__arch-tag">INSPECTION CORE</span>
            <div style={{ margin: '0.75rem 0' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--color-notion-blue)' }}>
                security
              </span>
            </div>
            <h3 className="landing__arch-title">OWASP ZAP 2.15</h3>
            <p className="landing__arch-sub">Automated spider + active fuzzing core</p>
          </div>
        </div>
      </section>

      {/* ─── Pre-Footer CTA Section ─── */}
      <section className="landing__cta" ref={ctaRef}>
        <div className="landing__cta-inner">
          <h2 className="landing__cta-title">
            Your security workspace starts{' '}
            <span className="landing__highlight-pill" style={{ background: '#ffb110' }}>today</span>.
          </h2>
          <p className="landing__cta-desc">
            Autonomous web security scanning built on open source OWASP ZAP.
            No signup barriers. Launch on your workstation in 30 seconds.
          </p>
          <div className="landing__hero-cta-row" style={{ marginBottom: 0 }}>
            <Link to="/scan/new" className="landing__btn-primary">
              Launch Scanner
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>radar</span>
            </Link>
            <a
              href="https://github.com/Nikku2716/BlackHawk"
              target="_blank"
              rel="noopener noreferrer"
              className="landing__btn-ghost-cta"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      </section>

      {/* ─── Moleskine / Notion Footer ─── */}
      <footer className="landing__footer">
        <div className="landing__footer-brand">
          <span className="landing__brand-mark" style={{ width: '22px', height: '22px', fontSize: '12px' }}>B</span>
          <span>BlackHawk Vulnerability Scanner</span>
          <span style={{ color: 'var(--color-stone)' }}>· v2.0.0</span>
        </div>

        <div className="landing__footer-links">
          <Link to="/dashboard" className="landing__footer-link">Dashboard</Link>
          <Link to="/capabilities" className="landing__footer-link">Capabilities</Link>
          <Link to="/scan/new" className="landing__footer-link">New Scan</Link>
          <a
            href="https://github.com/Nikku2716/BlackHawk"
            target="_blank"
            rel="noopener noreferrer"
            className="landing__footer-link"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
