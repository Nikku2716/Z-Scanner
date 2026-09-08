import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ScanMode } from '../api/client';
import gsap from 'gsap';

const MODES: { value: ScanMode; label: string; desc: string; icon: string; accent: string; tint: string }[] = [
  { value: 'quick', label: 'Quick', desc: 'Fast surface check, 5 pages max', icon: 'bolt', accent: 'var(--color-amethyst)', tint: 'rgba(124, 58, 237, 0.15)' },
  { value: 'fast', label: 'Fast', desc: 'Moderate depth, 20 pages crawl', icon: 'speed', accent: 'var(--color-lavender)', tint: 'rgba(167, 139, 250, 0.15)' },
  { value: 'deep', label: 'Deep', desc: 'Full recursive crawl, 100 pages', icon: 'network_check', accent: 'var(--color-warning-yellow)', tint: 'rgba(250, 204, 21, 0.15)' },
  { value: 'stealth', label: 'Stealth', desc: 'Low footprint, 10 pages max', icon: 'visibility_off', accent: 'var(--color-success-green)', tint: 'rgba(74, 222, 128, 0.15)' },
];

export default function NewScan() {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [mode, setMode] = useState<ScanMode>('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-header > *',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-form',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.15, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-mode-item',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, delay: 0.25, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const scan = await api.startScan(target, mode);
      navigate(`/scan/${scan.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef}>
      <header className="page-header gsap-header">
        <h1>New Scan</h1>
        <p>Enter a target URL and select scan depth</p>
      </header>

      <form onSubmit={handleSubmit} className="panel gsap-form" style={{ maxWidth: '580px' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-eyebrow)',
            color: 'var(--color-medium-gray)',
            marginBottom: '0.5rem',
            letterSpacing: 'var(--tracking-eyebrow)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Target URL
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
            autoFocus
            style={{ fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-eyebrow)',
            color: 'var(--color-medium-gray)',
            marginBottom: '0.65rem',
            letterSpacing: 'var(--tracking-eyebrow)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Scan Mode
          </label>
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {MODES.map((m) => {
              const selected = mode === m.value;
              return (
                <label
                  key={m.value}
                  className="gsap-mode-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    border: `1px solid ${selected ? 'var(--color-amethyst)' : 'rgba(255, 255, 255, 0.05)'}`,
                    borderRadius: 'var(--radius-cards)',
                    cursor: 'pointer',
                    background: selected ? 'rgba(124, 58, 237, 0.08)' : 'var(--color-surface)',
                    boxShadow: 'var(--shadow-subtle)',
                    transition: 'all var(--transition)',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      width: '34px',
                      height: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-buttons)',
                      color: selected ? m.accent : 'var(--color-muted-gray)',
                      fontSize: '1.15rem',
                      flexShrink: 0,
                      transition: 'all var(--transition)',
                      background: selected ? m.tint : 'var(--color-abyss)',
                    }}
                  >
                    {m.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--color-bright-gray)',
                    }}>
                      {m.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--color-medium-gray)', marginTop: '2px' }}>
                      {m.desc}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="mode"
                    value={m.value}
                    checked={selected}
                    onChange={() => setMode(m.value)}
                    style={{ width: 'auto', marginLeft: 'auto', accentColor: 'var(--color-amethyst)' }}
                  />
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            color: 'var(--color-error-red)',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            padding: '0.5rem 0.75rem',
            border: '1px solid rgba(248, 113, 113, 0.25)',
            borderRadius: 'var(--radius-buttons)',
            background: 'rgba(248, 113, 113, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>error</span>
            {error}
          </div>
        )}

        <button type="submit" className="primary" disabled={loading || !target.trim()}
          style={{
            width: '100%',
            padding: '7px 16px',
            minHeight: '36px',
            fontSize: '13.5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
            {loading ? 'hourglass_empty' : 'rocket_launch'}
          </span>
          {loading ? 'Launching…' : 'Start Scan'}
        </button>
      </form>
    </div>
  );
}
