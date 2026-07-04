interface Props {
  severity: string;
  count?: number;
  showCount?: boolean;
}

const config: Record<string, { bg: string; fg: string; icon: string }> = {
  High:          { bg: 'var(--error-container)',  fg: 'var(--error)', icon: 'error' },
  Medium:        { bg: '#ffd9c8',                 fg: 'var(--tertiary)', icon: 'warning' },
  Low:           { bg: 'var(--color-sticky-note-teal)', fg: '#2e6868', icon: 'info' },
  Informational: { bg: 'var(--surface-container-low)',  fg: 'var(--on-surface-variant)', icon: 'help_outline' },
};

export default function SeverityBadge({ severity, count, showCount }: Props) {
  const c = config[severity] ?? { bg: 'var(--surface-container-low)', fg: 'var(--on-surface-variant)', icon: 'help' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.1875rem 0.625rem',
        borderRadius: '6px',
        fontFamily: 'var(--font-label)',
        fontSize: '0.6875rem',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.fg}33`,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '0.8125rem', fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
      {severity}
      {showCount && (
        <span style={{ fontWeight: 400, opacity: 0.8, marginLeft: '0.125rem' }}>{count}</span>
      )}
    </span>
  );
}
