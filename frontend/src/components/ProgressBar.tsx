interface Props {
  label: string;
  value: number;
  active?: boolean;
}

export default function ProgressBar({ label, value, active }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-inter)', fontSize: '0.78rem', marginBottom: '0.45rem' }}>
        <span style={{
          color: active ? 'var(--color-bright-gray)' : 'var(--color-medium-gray)',
          fontWeight: active ? 600 : 500,
          transition: 'color var(--transition)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}>
          {active && <span className="pulse-dot" style={{ width: 6, height: 6 }} />}
          {label}
        </span>
        <span style={{ color: 'var(--color-medium-gray)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{
        height: '8px',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-small)',
        overflow: 'hidden',
      }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: pct === 100 ? 'var(--color-success-green)' : 'var(--color-amethyst)',
            transition: 'width var(--transition), background var(--transition)',
            borderRadius: 'var(--radius-small)',
          }}
        />
      </div>
    </div>
  );
}
