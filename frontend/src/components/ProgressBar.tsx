interface Props {
  label: string;
  value: number;
  active?: boolean;
}

export default function ProgressBar({ label, value, active }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-label)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
        <span style={{
          color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
          fontWeight: active ? 600 : 400,
          transition: 'color 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}>
          {active && <span className="pulse-dot" style={{ width: 6, height: 6 }} />}
          {label}
        </span>
        <span style={{ color: 'var(--outline)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{
        height: '10px',
        background: 'var(--surface-container-lowest)',
        borderRadius: '6px',
        overflow: 'hidden',
        border: '1px solid var(--outline-variant)',
      }}>
        <div
          className={active ? 'progress-glow' : ''}
          style={{
            height: '100%',
            width: `${pct}%`,
            background: active
              ? undefined /* handled by .progress-glow class */
              : pct === 100
                ? 'var(--primary-dim)'
                : 'var(--outline-variant)',
            transition: 'width 0.5s ease, background 0.3s ease',
            boxShadow: active ? '0 0 0 2px rgba(26, 51, 0, 0.12)' : 'none',
            borderRadius: '5px',
          }}
        />
      </div>
    </div>
  );
}
