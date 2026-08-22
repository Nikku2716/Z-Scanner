import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const CAPABILITIES = [
  {
    icon: 'travel_explore',
    title: 'Endpoint discovery',
    body: 'Spider targets to map reachable pages, parameters, and entry points before the report is assembled.',
    tone: 'mint',
  },
  {
    icon: 'shield',
    title: 'Passive analysis',
    body: 'Review headers, cookies, content security policy, and common misconfigurations without noisy probing.',
    tone: 'cream',
  },
  {
    icon: 'bolt',
    title: 'Active checks',
    body: 'Run deeper OWASP ZAP checks when the selected scan mode calls for broader verification.',
    tone: 'teal',
  },
  {
    icon: 'hub',
    title: 'OWASP mapping',
    body: 'Classify findings by risk and keep the evidence ready for triage, remediation, and audit trails.',
    tone: 'cream',
  },
  {
    icon: 'monitoring',
    title: 'Live progress',
    body: 'Track spidering, active scan percentage, passive queue depth, and scanner events as they happen.',
    tone: 'blush',
  },
  {
    icon: 'download',
    title: 'Report exports',
    body: 'Open a readable HTML report or export structured JSON for sharing, storage, and downstream tooling.',
    tone: 'cream',
  },
];

const MODES = [
  ['Quick', 'Fast surface scan for first-pass checks.'],
  ['Fast', 'Moderate crawl depth for routine reviews.'],
  ['Deep', 'Broader coverage for fuller assessments.'],
  ['Stealth', 'Low-footprint mode for quieter validation.'],
];

export default function Capabilities() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-cap-header > *',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );

      gsap.fromTo(
        '.gsap-cap-card',
        { opacity: 0, y: 20, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.06, delay: 0.15, ease: 'power2.out' }
      );

      gsap.fromTo(
        '.gsap-cap-strip',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.35, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      <header className="page-header capabilities-hero gsap-cap-header">
        <h1>What BlackHawk can do</h1>
        <p>
          BlackHawk wraps OWASP ZAP into a focused scanner workflow: choose a mode, watch the scan unfold,
          then review findings with risk labels and exportable evidence.
        </p>
      </header>

      <section className="capability-grid" aria-label="BlackHawk capabilities">
        {CAPABILITIES.map((item) => (
          <article
            className={`capability-card capability-card--${item.tone} gsap-cap-card`}
            key={item.title}
          >
            <span className="capability-card__icon material-symbols-outlined" aria-hidden="true">
              {item.icon}
            </span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </section>

      <section className="capability-strip panel gsap-cap-strip">
        <div>
          <span className="capability-strip__label">Scan modes</span>
          <h2>Pick the footprint before you press start.</h2>
        </div>
        <div className="mode-summary-grid">
          {MODES.map(([label, body]) => (
            <div className="mode-summary" key={label}>
              <span>{label}</span>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
