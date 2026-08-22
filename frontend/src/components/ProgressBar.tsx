interface Props {
  label: string;
  value: number;
  active?: boolean;
}

export default function ProgressBar({ label, value, active }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-label)', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
        <span style={{
          color: active ? 'var(--primary)' : 'var(--on-surface-variant)',
          fontWeight: active ? 600 : 400,
          transition: 'color 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {active && <span className="pulse-dot" style={{ width: 6, height: 6 }} />}
          {label}
        </span>
        <span style={{ color: 'var(--color-mist)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{
        height: '8px',
        background: 'var(--color-slate)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div
          className={active ? 'progress-glow' : ''}
          style={{
            height: '100%',
            width: `${pct}%`,
            background: active
              ? undefined
              : pct === 100
                ? 'var(--color-cyan)'
                : 'var(--color-steel)',
            transition: 'width 0.5s ease, background 0.3s ease',
            borderRadius: '4px',
            boxShadow: active ? '0 0 8px rgba(217, 119, 87, 0.25)' : 'none',
          }}
        />
      </div>
    </div>
  );
}
