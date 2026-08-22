interface Props {
  severity: string;
  count?: number;
  showCount?: boolean;
}

const config: Record<string, { bg: string; fg: string; border: string; icon: string }> = {
  High:          { bg: 'rgba(197, 48, 48, 0.08)',  fg: '#c53030', border: 'rgba(197, 48, 48, 0.2)', icon: 'error' },
  Medium:        { bg: 'rgba(183, 121, 31, 0.08)', fg: '#b7791f', border: 'rgba(183, 121, 31, 0.2)', icon: 'warning' },
  Low:           { bg: 'rgba(43, 108, 176, 0.08)',  fg: '#2b6cb0', border: 'rgba(43, 108, 176, 0.2)', icon: 'info' },
  Informational: { bg: 'rgba(135, 134, 127, 0.08)', fg: '#87867f', border: 'rgba(135, 134, 127, 0.2)', icon: 'help_outline' },
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
