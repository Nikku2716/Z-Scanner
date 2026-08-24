interface Props {
  severity: string;
  count?: number;
  showCount?: boolean;
}

const config: Record<string, { bg: string; fg: string; border: string; icon: string }> = {
  High:          { bg: 'rgba(220, 38, 38, 0.08)',  fg: '#b91c1c', border: 'rgba(220, 38, 38, 0.22)', icon: 'error' },
  Medium:        { bg: 'rgba(217, 119, 6, 0.08)',  fg: '#b45309', border: 'rgba(217, 119, 6, 0.25)', icon: 'warning' },
  Low:           { bg: 'rgba(37, 99, 235, 0.07)',  fg: '#1d4ed8', border: 'rgba(37, 99, 235, 0.22)', icon: 'info' },
  Informational: { bg: 'rgba(111, 106, 96, 0.08)', fg: '#6f6a60', border: 'rgba(111, 106, 96, 0.25)', icon: 'help_outline' },
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
