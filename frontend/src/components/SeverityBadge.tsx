interface Props {
  severity: string;
  count?: number;
  showCount?: boolean;
}

const config: Record<string, { bg: string; fg: string; border: string; icon: string }> = {
  High:          { bg: 'var(--color-petal-pink)', fg: '#9f1239', border: '#f472b6', icon: 'error' },
  Medium:        { bg: 'var(--color-canary-yellow)', fg: '#854d0e', border: '#facc15', icon: 'warning' },
  Low:           { bg: 'var(--color-soft-violet)', fg: '#3730a3', border: '#a78bfa', icon: 'info' },
  Informational: { bg: 'var(--color-pearl)', fg: 'var(--color-ash)', border: 'rgba(17, 17, 17, 0.1)', icon: 'help_outline' },
};

export default function SeverityBadge({ severity, count, showCount }: Props) {
  const c = config[severity] ?? { bg: 'var(--color-pearl)', fg: 'var(--color-ash)', border: 'rgba(17, 17, 17, 0.1)', icon: 'help' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.6rem',
        borderRadius: 'var(--radius-pills)',
        fontFamily: 'var(--font-inter)',
        fontSize: '0.68rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>{c.icon}</span>
      {severity}
      {showCount && (
        <span style={{ fontWeight: 700, marginLeft: '0.15rem' }}>{count}</span>
      )}
    </span>
  );
}
