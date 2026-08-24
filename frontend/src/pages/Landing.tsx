import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Splits text into per-char spans while keeping word wrapping intact. */
function SplitChars({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((word, wi) => (
        <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.split('').map((ch, ci) => (
            <span className="landing__char" key={ci}>
              {ch}
            </span>
          ))}
          {wi < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

const TERMINAL_SCRIPT = [
  'blackhawk scan --target https://example.com --mode deep',
  '[INFO] Spider engaged — crawling entry points…',
  '[INFO] 24 pages discovered · mapping parameters',
  '[WARN] Reflected XSS detected at /search?q=',
  '[HIGH] SQL injection confirmed at /api/users',
  '[DONE] Scan complete — 3 High · 5 Medium · 12 Low',
];

export default function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const modesRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      // ── Hero intro ──
      if (heroRef.current) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(
          '.landing__hero-badge',
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.5 },
          0.05
        )
          .fromTo(
            heroRef.current.querySelectorAll('.landing__char'),
            { opacity: 0, y: '0.7em', rotateX: -60 },
            {
              opacity: 1,
              y: 0,
              rotateX: 0,
              duration: 0.55,
              stagger: { each: 0.016, from: 'start' },
            },
            0.15
          )
          .fromTo(
            '.landing__hero-desc, .landing__hero-actions',
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.12 },
            '-=0.25'
          );
      }

      // ── Terminal entrance + typewriter loop ──
      if (terminalRef.current) {
        gsap.fromTo(
          terminalRef.current,
          { opacity: 0, y: 36, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, delay: 0.35, ease: 'power3.out' }
        );

        if (!prefersReduced && typedRef.current) {
          let lineIndex = 0;
          let charIndex = 0;
          let timer: number;

          const typeNextChar = () => {
            const el = typedRef.current;
            if (!el) return;
            const line = TERMINAL_SCRIPT[lineIndex];
            el.textContent = line.slice(0, ++charIndex);

            const isCmd = line.startsWith('$') || line.includes('blackhawk scan');
            el.style.color = line.startsWith('[HIGH]')
              ? '#ff7b72'
              : line.startsWith('[WARN]')
                ? '#fbbf24'
                : line.startsWith('[DONE]')
                  ? '#4ade80'
                  : isCmd
                    ? '#f4f8fd'
                    : '#7dd3fc';

            if (charIndex < line.length) {
              timer = window.setTimeout(typeNextChar, line.startsWith('$') ? 34 : 16);
            } else {
              timer = window.setTimeout(() => {
                charIndex = 0;
                lineIndex = (lineIndex + 1) % TERMINAL_SCRIPT.length;
                typeNextChar();
              }, 2200);
            }
          };
          timer = window.setTimeout(typeNextChar, 1400);
          // store for cleanup via context
          (terminalRef.current as HTMLElement & { __cleanup?: () => void }).__cleanup =
            () => clearTimeout(timer);
        }
      }

      if (prefersReduced) return; // skip scroll choreography below

      // ── Metrics: stagger + count-up values ──
      if (metricsRef.current) {
        gsap.fromTo(
          metricsRef.current.children,
          { opacity: 0, y: 18 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: metricsRef.current,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          }
        );

        metricsRef.current
          .querySelectorAll<HTMLElement>('[data-count]')
          .forEach((el) => {
            const end = parseInt(el.dataset.count || '0', 10);
            const obj = { v: 0 };
            gsap.to(obj, {
              v: end,
              duration: 1.4,
              ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 90%' },
              onUpdate: () => {
                el.textContent = String(Math.round(obj.v));
              },
            });
          });
      }

      // ── Feature cards: wave stagger from center ──
      if (featuresRef.current) {
        gsap.fromTo(
          featuresRef.current.children,
          { opacity: 0, y: 26, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            stagger: { each: 0.07, from: 'center', grid: 'auto' },
            ease: 'back.out(1.3)',
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // ── Steps slide in with connectors ──
      if (stepsRef.current) {
        gsap.fromTo(
          stepsRef.current.children,
          { opacity: 0, x: -28 },
          {
            opacity: 1,
            x: 0,
            duration: 0.55,
            stagger: 0.14,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: stepsRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // ── Mode cards ──
      if (modesRef.current) {
        gsap.fromTo(
          modesRef.current.children,
          { opacity: 0, y: 20, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
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

      // ── Architecture nodes ──
      if (archRef.current) {
        gsap.fromTo(
          archRef.current.children,
          { opacity: 0, x: -22 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.11,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: archRef.current,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // ── CTA ──
      if (ctaRef.current) {
        gsap.fromTo(
          ctaRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: ctaRef.current,
              start: 'top 82%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // ── Section headers reveal ──
      containerRef.current?.querySelectorAll('.landing__section-header').forEach((header) => {
        gsap.fromTo(
          header.children,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: header,
              start: 'top 90%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // ── Parallax drift on terminal ──
      if (terminalRef.current) {
        gsap.to(terminalRef.current, {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: {
            trigger: terminalRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, containerRef);

    return () => {
      const cleanup = (terminalRef.current as (HTMLElement & { __cleanup?: () => void }) | null)
        ?.__cleanup;
      cleanup?.();
      ctx.revert();
    };
  }, []);

  /** Spotlight hover — tracks pointer into CSS vars consumed by the card gradient. */
  function handleSpotlight(e: React.MouseEvent<HTMLDivElement>) {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
    card.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
  }

  return (
    <div className="landing" ref={containerRef}>
      {/* ─── Backdrop layers ─── */}
      <div className="landing__backdrop" aria-hidden="true" />
      <div className="landing__scanlines" aria-hidden="true" />

      {/* ─── Nav ─── */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <div className="landing__brand">
            <span className="landing__brand-title">
              <span className="landing__brand-black">Black</span>
              <span className="landing__brand-hawk">Hawk</span>
            </span>
          </div>
          <div className="landing__nav-links">
            <a href="#features" className="landing__nav-link">Features</a>
            <a href="#how-it-works" className="landing__nav-link">How It Works</a>
            <a href="#modes" className="landing__nav-link">Scan Modes</a>
          </div>
          <Link to="/scan/new" className="landing__nav-cta" data-magnetic>
            Launch Scanner
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_forward</span>
          </Link>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="landing__hero">
        <div className="landing__hero-content" ref={heroRef}>
          <div className="landing__hero-badge">
            <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>verified</span>
            Powered by OWASP ZAP
          </div>
          <h1 className="landing__hero-title">
            Hunt Vulnerabilities<br />
            <span className="landing__hero-accent"><SplitChars text="Before They Hunt You" /></span>
          </h1>
          <p className="landing__hero-desc">
            Real-time web application security scanning with live progress tracking,
            risk-based filtering, and comprehensive OWASP coverage — all from your browser.
          </p>
          <div className="landing__hero-actions">
            <Link to="/scan/new" className="landing__btn-primary" data-magnetic>
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>radar</span>
              Start Scanning
            </Link>
            <Link to="/dashboard" className="landing__btn-secondary">
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>grid_view</span>
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Terminal preview */}
        <div className="landing__hero-terminal" ref={terminalRef}>
          <div className="landing__terminal-bar">
            <span className="landing__terminal-dot landing__terminal-dot--red" />
            <span className="landing__terminal-dot landing__terminal-dot--amber" />
            <span className="landing__terminal-dot landing__terminal-dot--green" />
            <span className="landing__terminal-title">blackhawk — scan</span>
          </div>
          <div className="landing__terminal-body">
            <div className="landing__typed-line" ref={typedRef} aria-hidden="true" />
            <noscript>
              <div className="landing__terminal-line">
                <span className="landing__terminal-prompt">$</span> blackhawk scan --target https://example.com
              </div>
            </noscript>
            <div className="landing__terminal-line landing__terminal-line--dim">
              <span className="landing__terminal-prefix">[INFO]</span> Initializing spider scan...
            </div>
            <div className="landing__terminal-line landing__terminal-line--accent">
              <span className="landing__terminal-prefix landing__terminal-prefix--warn">[WARN]</span> XSS vulnerability detected at /search?q=
            </div>
            <div className="landing__terminal-line landing__terminal-line--accent">
              <span className="landing__terminal-prefix landing__terminal-prefix--err">[HIGH]</span> SQL injection found at /api/users
            </div>
            <div className="landing__terminal-line landing__terminal-line--dim">
              <span className="landing__terminal-prefix">[INFO]</span> Active scan progress: 78%
            </div>
            <div className="landing__terminal-line">
              <span className="landing__terminal-prefix landing__terminal-prefix--ok">[DONE]</span> Scan complete — 3 High, 5 Medium, 12 Low
            </div>
            <div className="landing__terminal-line">
              <span className="landing__terminal-prompt landing__terminal-cursor">_</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Metrics Strip ─── */}
      <section className="landing__metrics">
        <div className="landing__metrics-inner" ref={metricsRef}>
          {[
            { value: '4', label: 'Scan Modes', icon: 'tune' },
            { value: 'Live', label: 'WebSocket Progress', icon: 'cell_tower' },
            { value: 'OWASP', label: 'ZAP Coverage', icon: 'security' },
            { value: 'JSON/HTML', label: 'Export Formats', icon: 'download' },
          ].map((m) => (
            <div className="landing__metric" key={m.label}>
              <span className="material-symbols-outlined landing__metric-icon" aria-hidden="true">{m.icon}</span>
              <div className="landing__metric-value">{m.value}</div>
              <div className="landing__metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="landing__section" id="features">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>auto_awesome</span>
              Capabilities
            </span>
            <h2 className="landing__section-title">Everything You Need to<br />Secure Your Web Apps</h2>
            <p className="landing__section-desc">
              Built on top of OWASP ZAP, BlackHawk brings enterprise-grade vulnerability
              scanning into a streamlined developer experience.
            </p>
          </div>
          <div className="landing__features-grid" ref={featuresRef}>
            {[
              {
                icon: 'flash_on',
                title: '4 Scan Modes',
                desc: 'Quick, Fast, Deep, or Stealth — choose the crawl depth and footprint that fits your workflow.',
                accent: 'primary',
              },
              {
                icon: 'cell_tower',
                title: 'Real-Time Progress',
                desc: "Live spider and active scan updates via WebSocket. Watch vulnerabilities surface as they're found.",
                accent: 'cyan',
              },
              {
                icon: 'filter_alt',
                title: 'Risk-Based Filtering',
                desc: 'Filter alerts by High, Medium, Low, and Informational. Focus on what matters most.',
                accent: 'amber',
              },
              {
                icon: 'stop_circle',
                title: 'Stop & Retry',
                desc: 'Cancel running scans instantly and start new ones. Full control over your scanning pipeline.',
                accent: 'primary',
              },
              {
                icon: 'security',
                title: 'OWASP Coverage',
                desc: 'XSS, SQL injection, misconfigurations, and more — powered by the industry-standard ZAP engine.',
                accent: 'cyan',
              },
              {
                icon: 'download',
                title: 'Export Results',
                desc: 'Download comprehensive scan reports as JSON for automation or HTML for stakeholder review.',
                accent: 'amber',
              },
            ].map((f) => (
              <div className="landing__feature-card" key={f.title} onMouseMove={handleSpotlight}>
                <div className={`landing__feature-icon landing__feature-icon--${f.accent}`}>
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
                <h3 className="landing__feature-title">{f.title}</h3>
                <p className="landing__feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="landing__section landing__section--alt" id="how-it-works">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>route</span>
              Workflow
            </span>
            <h2 className="landing__section-title">Three Steps to<br />Full Coverage</h2>
          </div>
          <div className="landing__steps" ref={stepsRef}>
            {[
              {
                step: '01',
                icon: 'add_circle',
                title: 'Enter Target URL',
                desc: 'Point BlackHawk at any web application. Choose a scan mode that fits your security needs.',
              },
              {
                step: '02',
                icon: 'radar',
                title: 'Watch It Scan',
                desc: 'The spider crawls your app while the active scanner probes for vulnerabilities — all in real time.',
              },
              {
                step: '03',
                icon: 'assignment',
                title: 'Review & Export',
                desc: 'Browse findings by risk level, dive into details, and export reports for your team.',
              },
            ].map((s, i) => (
              <div className="landing__step" key={s.step}>
                <div className="landing__step-number">{s.step}</div>
                <div className="landing__step-icon">
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <h3 className="landing__step-title">{s.title}</h3>
                <p className="landing__step-desc">{s.desc}</p>
                {i < 2 && <div className="landing__step-connector" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Scan Modes ─── */}
      <section className="landing__section" id="modes">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>tune</span>
              Scan Modes
            </span>
            <h2 className="landing__section-title">Choose Your Attack Surface</h2>
          </div>
          <div className="landing__modes-grid" ref={modesRef}>
            {[
              { mode: 'Quick', pages: '5', desc: 'Fast surface scan for rapid feedback.', icon: 'bolt' },
              { mode: 'Fast', pages: '20', desc: 'Moderate depth for balanced coverage.', icon: 'speed' },
              { mode: 'Deep', pages: '100', desc: 'Full crawl for thorough analysis.', icon: 'layers' },
              { mode: 'Stealth', pages: '10', desc: 'Low footprint, minimal detection.', icon: 'visibility_off' },
            ].map((m) => (
              <div className="landing__mode-card" key={m.mode}>
                <div className="landing__mode-icon">
                  <span className="material-symbols-outlined">{m.icon}</span>
                </div>
                <h3 className="landing__mode-name">{m.mode}</h3>
                <div className="landing__mode-pages">
                  <span className="landing__mode-pages-value">{m.pages}</span> max pages
                </div>
                <p className="landing__mode-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Architecture ─── */}
      <section className="landing__section landing__section--alt">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-badge">
              <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>architecture</span>
              Architecture
            </span>
            <h2 className="landing__section-title">Built for Simplicity</h2>
            <p className="landing__section-desc">
              Three containers, one command. Docker Compose orchestrates everything.
            </p>
          </div>
          <div className="landing__arch" ref={archRef}>
            <div className="landing__arch-node">
              <div className="landing__arch-icon">
                <span className="material-symbols-outlined">web</span>
              </div>
              <div className="landing__arch-label">React / Vite</div>
              <div className="landing__arch-sub">Frontend Dashboard</div>
            </div>
            <div className="landing__arch-arrow" aria-hidden="true">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
            <div className="landing__arch-node">
              <div className="landing__arch-icon landing__arch-icon--primary">
                <span className="material-symbols-outlined">dns</span>
              </div>
              <div className="landing__arch-label">Go API</div>
              <div className="landing__arch-sub">chi router + SQLite</div>
            </div>
            <div className="landing__arch-arrow" aria-hidden="true">
              <span className="material-symbols-outlined">arrow_forward</span>
            </div>
            <div className="landing__arch-node">
              <div className="landing__arch-icon landing__arch-icon--cyan">
                <span className="material-symbols-outlined">security</span>
              </div>
              <div className="landing__arch-label">OWASP ZAP</div>
              <div className="landing__arch-sub">Scanner Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="landing__cta">
        <div className="landing__cta-inner" ref={ctaRef}>
          <h2 className="landing__cta-title">
            Ready to Secure Your<br />
            <span className="landing__hero-accent">Web Applications?</span>
          </h2>
          <p className="landing__cta-desc">
            Open source under GPLv3. No signup required.<br />
            Clone, compose, and start scanning.
          </p>
          <div className="landing__hero-actions">
            <Link to="/scan/new" className="landing__btn-primary" data-magnetic>
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>rocket_launch</span>
              Launch Scanner
            </Link>
            <a
              href="https://github.com/Nikku2716/BlackHawk"
              target="_blank"
              rel="noopener noreferrer"
              className="landing__btn-secondary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>code</span>
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing__footer">
        <span>Developed by ghostblade</span>
        <span>opensource.</span>
      </footer>
    </div>
  );
}
