import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ScanMode } from '../api/client';
import gsap from 'gsap';

const MODES: { value: ScanMode; label: string; desc: string; icon: string; pastel: string }[] = [
  { value: 'quick', label: 'Quick', desc: 'Fast surface check, 5 pages max', icon: 'bolt', pastel: 'var(--color-aqua)' },
  { value: 'fast', label: 'Fast', desc: 'Moderate depth, 20 pages crawl', icon: 'speed', pastel: 'var(--color-mint-green)' },
  { value: 'deep', label: 'Deep', desc: 'Full recursive crawl, 100 pages', icon: 'network_check', pastel: 'var(--color-canary-yellow)' },
  { value: 'stealth', label: 'Stealth', desc: 'Low footprint, 10 pages max', icon: 'visibility_off', pastel: 'var(--color-soft-violet)' },
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
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-eyebrow)',
            color: 'var(--color-ash)',
            marginBottom: '0.625rem',
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
            style={{ fontSize: '0.95rem' }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-inter)',
            fontSize: 'var(--text-eyebrow)',
            color: 'var(--color-ash)',
            marginBottom: '0.75rem',
            letterSpacing: 'var(--tracking-eyebrow)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Scan Mode
          </label>
          <div style={{ display: 'grid', gap: '0.65rem' }}>
            {MODES.map((m) => {
              const selected = mode === m.value;
              return (
                <label
                  key={m.value}
                  className="gsap-mode-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.95rem 1.15rem',
                    border: `1px solid ${selected ? 'var(--color-ink)' : 'rgba(17, 17, 17, 0.08)'}`,
                    borderRadius: 'var(--radius-cards)',
                    cursor: 'pointer',
                    background: selected ? 'var(--color-pearl)' : '#ffffff',
                    transition: 'all var(--transition)',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      width: '38px',
                      height: '38px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-buttons)',
                      color: 'var(--color-ink)',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                      transition: 'all var(--transition)',
                      background: selected ? m.pastel : 'var(--color-pearl)',
                    }}
                  >
                    {m.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--color-ink)',
                    }}>
                      {m.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--color-ash)', marginTop: '0.125rem' }}>
                      {m.desc}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="mode"
                    value={m.value}
                    checked={selected}
                    onChange={() => setMode(m.value)}
                    style={{ width: 'auto', marginLeft: 'auto', accentColor: 'var(--color-ink)' }}
                  />
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            color: 'var(--color-vermillion)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            padding: '0.625rem 0.875rem',
            border: '1px solid rgba(232, 64, 13, 0.25)',
            borderRadius: 'var(--radius-buttons)',
            background: '#fff5f5',
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
            padding: '0.875rem',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
            {loading ? 'hourglass_empty' : 'rocket_launch'}
          </span>
          {loading ? 'Launching…' : 'Start Scan'}
        </button>
      </form>
    </div>
  );
}
