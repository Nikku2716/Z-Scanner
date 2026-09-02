interface Props {
  severity: string;
  count?: number;
  showCount?: boolean;
}

const config: Record<string, { bg: string; fg: string; border: string; icon: string }> = {
  High:          { bg: '#fef2f2', fg: 'var(--color-vermillion)', border: 'rgba(227, 45, 20, 0.25)', icon: 'error' },
  Medium:        { bg: '#fffbeb', fg: '#b45309', border: 'rgba(232, 157, 1, 0.28)', icon: 'warning' },
  Low:           { bg: 'var(--color-sky-tint)', fg: 'var(--color-notion-blue)', border: 'rgba(0, 117, 222, 0.25)', icon: 'info' },
  Informational: { bg: '#f4f4f5', fg: 'var(--color-stone)', border: 'rgba(0, 0, 0, 0.12)', icon: 'help_outline' },
};

export default function SeverityBadge({ severity, count, showCount }: Props) {
  const c = config[severity] ?? { bg: 'rgba(100, 116, 139, 0.1)', fg: '#94a3b8', border: 'rgba(100, 116, 139, 0.2)', icon: 'help' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontFamily: 'var(--font-label)',
        fontSize: '0.65rem',
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '0.8rem', fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
      {severity}
      {showCount && (
        <span style={{ fontWeight: 400, opacity: 0.8, marginLeft: '0.1rem' }}>{count}</span>
      )}
    </span>
  );
}
