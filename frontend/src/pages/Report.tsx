import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Scan } from '../api/client';
import AlertTable from '../components/AlertTable';
import SeverityBadge from '../components/SeverityBadge';

const FILTERS = ['all', 'High', 'Medium', 'Low', 'Informational'];

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getReport(id)
      .then(setScan)
      .catch((e) => setError(e.message));
  }, [id]);

  const counts = useMemo(() => {
    if (!scan) return {};
    const c: Record<string, number> = {};
    for (const a of scan.alerts) {
      c[a.risk] = (c[a.risk] ?? 0) + 1;
    }
    return c;
  }, [scan]);

  function exportJSON() {
    if (!scan) return;
    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackhawk-${scan.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return (
    <div className="panel" style={{ color: 'var(--error)', borderLeft: '4px solid var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>error</span>
      {error}
    </div>
  );

  if (!scan) return (
    <div className="panel" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', padding: '3rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>hourglass_empty</span>
      Loading report…
    </div>
  );

  const total = scan.alerts.length;

  return (
    <>
      <header className="page-header">
        <h1>Scan Report</h1>
        <p style={{ wordBreak: 'break-all' }}>{scan.target} · {scan.config.mode} mode · {new Date(scan.createdAt).toLocaleString()}</p>
      </header>

      <div className="panel toolbar" style={{ gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          {(['High', 'Medium', 'Low', 'Informational'] as const).map((risk) => (
            <div key={risk} style={{ textAlign: 'center', minWidth: '60px' }}>
              <SeverityBadge severity={risk} count={counts[risk] ?? 0} showCount />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>notifications</span>
            {total} alert{total !== 1 ? 's' : ''}
          </span>
          <button onClick={exportJSON} className="ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>download</span>
            JSON
          </button>
          <a href={api.reportHTMLUrl(scan.id)} target="_blank" rel="noreferrer">
            <button className="ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>code</span>
              HTML
            </button>
          </a>
          <Link to="/">
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>grid_view</span>
              Dashboard
            </button>
          </Link>
        </div>
      </div>

      <div className="panel" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'primary' : ''}
              style={filter === f ? { fontSize: '0.8125rem' } : {
                background: 'transparent',
                borderColor: 'var(--outline-variant)',
                color: 'var(--on-surface-variant)',
                fontSize: '0.8125rem',
              }}
            >
              {f === 'all' ? 'All' : f}
              {scan && f !== 'all' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          ))}
        </div>
        <AlertTable alerts={scan.alerts} filter={filter} />
      </div>
    </>
  );
}
