import SeverityBadge from './SeverityBadge';
import type { Alert } from '../api/client';

interface Props {
  alerts: Alert[];
  filter?: string;
}

export default function AlertTable({ alerts, filter }: Props) {
  const filtered = filter && filter !== 'all'
    ? alerts.filter((a) => a.risk === filter)
    : alerts;

  if (filtered.length === 0) {
    return (
      <div style={{ color: 'var(--color-medium-gray)', fontSize: '0.85rem', padding: '3rem 0', textAlign: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}>filter_alt_off</span>
        No alerts match this filter.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <th style={{
              padding: '0.75rem 0.625rem',
              color: 'var(--color-medium-gray)',
              fontFamily: 'var(--font-inter)',
              fontWeight: 600,
              textAlign: 'left',
              fontSize: 'var(--text-eyebrow)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-eyebrow)',
            }}>Risk</th>
            <th style={{
              padding: '0.75rem 0.625rem',
              color: 'var(--color-medium-gray)',
              fontFamily: 'var(--font-inter)',
              fontWeight: 600,
              textAlign: 'left',
              fontSize: 'var(--text-eyebrow)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-eyebrow)',
            }}>Alert</th>
            <th style={{
              padding: '0.75rem 0.625rem',
              color: 'var(--color-medium-gray)',
              fontFamily: 'var(--font-inter)',
              fontWeight: 600,
              textAlign: 'left',
              fontSize: 'var(--text-eyebrow)',
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-eyebrow)',
            }}>URL</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((alert) => (
            <tr
              key={alert.id}
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                transition: 'background var(--transition)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.03)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <td style={{ padding: '0.875rem 0.625rem', verticalAlign: 'top', width: '130px' }}>
                <SeverityBadge severity={alert.risk} />
              </td>
              <td style={{ padding: '0.875rem 0.625rem', verticalAlign: 'top' }}>
                <div style={{ color: 'var(--color-bright-gray)', fontFamily: 'var(--font-inter)', fontWeight: 600 }}>{alert.name}</div>
                <div style={{ color: 'var(--color-muted-gray)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
                  Plugin {alert.pluginId || 'n/a'}
                  {alert.param ? ` · Param ${alert.param}` : ''}
                  {alert.method ? ` · ${alert.method}` : ''}
                </div>
                <div style={{ color: 'var(--color-medium-gray)', fontFamily: 'var(--font-inter)', fontSize: '0.8125rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
                  {alert.description.slice(0, 150)}{alert.description.length > 150 ? '…' : ''}
                </div>
                {(alert.attack || alert.evidence) && (
                  <div style={{ color: 'var(--color-warning-yellow)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', marginTop: '0.35rem', lineHeight: 1.5, wordBreak: 'break-all' }}>
                    {alert.attack ? `Attack: ${alert.attack}` : ''}
                    {alert.attack && alert.evidence ? ' · ' : ''}
                    {alert.evidence ? `Evidence: ${alert.evidence}` : ''}
                  </div>
                )}
              </td>
              <td style={{
                padding: '0.875rem 0.625rem',
                verticalAlign: 'top',
                wordBreak: 'break-all',
                color: 'var(--color-bright-gray)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                maxWidth: '300px',
              }}>
                {alert.url}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
