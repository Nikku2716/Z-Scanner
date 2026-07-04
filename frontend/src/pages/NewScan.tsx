import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ScanMode } from '../api/client';

const MODES: { value: ScanMode; label: string; desc: string; icon: string }[] = [
  { value: 'quick', label: 'Quick', desc: 'Fast surface scan, 5 pages max', icon: 'bolt' },
  { value: 'fast', label: 'Fast', desc: 'Moderate depth, 20 pages', icon: 'speed' },
  { value: 'deep', label: 'Deep', desc: 'Full crawl, 100 pages', icon: 'network_check' },
  { value: 'stealth', label: 'Stealth', desc: 'Low footprint, 10 pages', icon: 'visibility_off' },
];

export default function NewScan() {
  const navigate = useNavigate();
  const [target, setTarget] = useState('');
  const [mode, setMode] = useState<ScanMode>('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <>
      <header className="page-header">
        <h1>New Scan</h1>
        <p>Enter a target URL and select scan depth</p>
      </header>

      <form onSubmit={handleSubmit} className="panel" style={{ maxWidth: '580px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-label)',
            fontSize: '0.6875rem',
            color: 'var(--on-surface-variant)',
            marginBottom: '0.625rem',
            letterSpacing: '0.08em',
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
            style={{ fontSize: '0.9375rem' }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontFamily: 'var(--font-label)',
            fontSize: '0.6875rem',
            color: 'var(--on-surface-variant)',
            marginBottom: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            Scan Mode
          </label>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {MODES.map((m, i) => {
              const selected = mode === m.value;
              return (
                <label
                  key={m.value}
                  className="fade-in"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem 1.125rem',
                    border: `1px solid ${selected ? 'var(--primary)' : 'var(--outline-variant)'}`,
                    borderRadius: 'var(--radius-lg)',
                    cursor: 'pointer',
                    background: selected ? 'var(--color-sticky-note-mint)' : 'var(--surface-bright)',
                    transition: 'all 0.25s ease',
                    boxShadow: selected ? 'var(--shadow-note)' : 'none',
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius)',
                      border: `1px solid ${selected ? 'var(--primary)' : 'var(--outline-variant)'}`,
                      color: selected ? 'var(--primary)' : 'var(--on-surface-variant)',
                      fontSize: '1.25rem',
                      flexShrink: 0,
                      transition: 'all 0.25s ease',
                      background: selected ? 'var(--color-highlighter-yellow)' : 'transparent',
                    }}
                  >
                    {m.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-headline)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: selected ? 'var(--primary)' : 'var(--on-surface)',
                    }}>
                      {m.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--outline)', marginTop: '0.125rem' }}>
                      {m.desc}
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="mode"
                    value={m.value}
                    checked={selected}
                    onChange={() => setMode(m.value)}
                    style={{ width: 'auto', marginLeft: 'auto', accentColor: 'var(--primary)' }}
                  />
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{
            color: 'var(--error)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
            padding: '0.625rem 0.875rem',
            border: '1px solid rgba(181, 52, 31, 0.35)',
            borderRadius: 'var(--radius)',
            background: 'var(--error-container)',
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
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>
            {loading ? 'hourglass_empty' : 'rocket_launch'}
          </span>
          {loading ? 'Launching…' : 'Start Scan'}
        </button>
      </form>
    </>
  );
}
