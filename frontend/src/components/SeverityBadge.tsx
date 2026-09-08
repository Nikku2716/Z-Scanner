interface Props {
  severity: string;
  count?: number;
  showCount?: boolean;
}

const config: Record<string, { bg: string; fg: string; border: string; icon: string }> = {
  High:          { bg: 'rgba(248, 113, 113, 0.15)', fg: 'var(--color-error-red)', border: 'rgba(248, 113, 113, 0.3)', icon: 'error' },
  Medium:        { bg: 'rgba(250, 204, 21, 0.15)', fg: 'var(--color-warning-yellow)', border: 'rgba(250, 204, 21, 0.3)', icon: 'warning' },
  Low:           { bg: 'rgba(167, 139, 250, 0.15)', fg: 'var(--color-lavender)', border: 'rgba(167, 139, 250, 0.3)', icon: 'info' },
  Informational: { bg: 'rgba(255, 255, 255, 0.05)', fg: 'var(--color-medium-gray)', border: 'rgba(255, 255, 255, 0.1)', icon: 'help_outline' },
};

export default function SeverityBadge({ severity, count, showCount }: Props) {
  const c = config[severity] ?? { bg: 'rgba(255, 255, 255, 0.05)', fg: 'var(--color-medium-gray)', border: 'rgba(255, 255, 255, 0.1)', icon: 'help' };
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
