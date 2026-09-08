import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type AttackSurface, type Endpoint } from '../api/client';

const METHOD_PASTELS: Record<string, { bg: string; color: string }> = {
  GET: { bg: 'rgba(167, 139, 250, 0.15)', color: 'var(--color-lavender)' },
  POST: { bg: 'rgba(250, 204, 21, 0.15)', color: 'var(--color-warning-yellow)' },
  PUT: { bg: 'rgba(74, 222, 128, 0.15)', color: 'var(--color-success-green)' },
  DELETE: { bg: 'rgba(248, 113, 113, 0.15)', color: 'var(--color-error-red)' },
  PATCH: { bg: 'rgba(138, 92, 245, 0.15)', color: 'var(--color-lavender)' },
};

function MethodTag({ method }: { method: string }) {
  const styling = METHOD_PASTELS[method] ?? { bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-bright-gray)' };
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.68rem',
      fontWeight: 600,
      letterSpacing: '0.04em',
      color: styling.color,
      background: styling.bg,
      borderRadius: 'var(--radius-buttons)',
      padding: '0.15rem 0.5rem',
      display: 'inline-block',
    }}>
      {method}
    </span>
  );
}

export default function AttackSurfacePage() {
  const { id = '' } = useParams();
  const [surface, setSurface] = useState<AttackSurface | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.getSurface(id, { method: methodFilter || undefined, search: search.trim() || undefined })
      .then(setSurface)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load attack surface'))
      .finally(() => setLoading(false));
  }, [id, methodFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const methods = useMemo(
    () => Object.entries(surface?.methodCounts ?? {}).sort((a, b) => b[1] - a[1]),
    [surface],
  );

  return (
    <div>
      <header className="page-header">
        <h1>Attack Surface</h1>
        {surface && <p>{surface.target} — {surface.total} endpoint{surface.total !== 1 ? 's' : ''}</p>}
      </header>

      {!surface && !error && (
        <div className="panel" style={{ color: 'var(--color-medium-gray)', textAlign: 'center', padding: '3.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>hourglass_empty</span>
          Loading attack surface…
        </div>
      )}

      {error && (
        <div className="panel" style={{ color: 'var(--color-error-red)', borderColor: 'rgba(248, 113, 113, 0.25)', background: 'rgba(248, 113, 113, 0.1)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
            {error}
          </span>
          <Link to="/dashboard"><button className="ghost" style={{ marginTop: '1rem' }}>Back to Dashboard</button></Link>
        </div>
      )}

      {surface && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <StatCard label="Endpoints" value={String(surface.total)} icon="hub" />
            {methods.slice(0, 3).map(([m, n]) => (
              <StatCard key={m} label={m} value={String(n)} icon="swap_horiz" />
            ))}
            {(['High', 'Medium', 'Low'] as const).map((risk) => surface.riskTotals[risk] > 0 && (
              <StatCard key={risk} label={`${risk} risk`} value={String(surface.riskTotals[risk])} icon="warning" />
            ))}
          </div>

          <form className="panel search-panel" onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Search paths or URLs…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search endpoints"
            />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              aria-label="Filter by HTTP method"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-bright-gray)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-buttons)',
                padding: '0.45rem 0.75rem',
                fontFamily: 'var(--font-inter)',
                fontSize: '0.8125rem',
              }}
            >
              <option value="">All methods</option>
              {methods.map(([m]) => <option key={m} value={m}>{m}</option>)}
            </select>
          </form>

          {loading && <p style={{ color: 'var(--color-medium-gray)', fontFamily: 'var(--font-inter)', fontSize: '0.85rem' }}>Filtering…</p>}

          {!loading && surface.endpoints.length === 0 && (
            <div className="panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--color-muted-gray)' }}>search_off</span>
              <p style={{ color: 'var(--color-medium-gray)' }}>No endpoints match the current filters.</p>
              <button className="ghost" onClick={() => { setSearch(''); setMethodFilter(''); }}>Clear filters</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {surface.endpoints.map((ep: Endpoint) => (
              <div key={ep.id || ep.url + ep.method} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <MethodTag method={ep.method} />
                  <code style={{ fontSize: '0.85rem', wordBreak: 'break-all', flex: 1, color: 'var(--color-bright-gray)' }}>{ep.path}</code>
                  {(ep.statusCode ?? 0) > 0 && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: (ep.statusCode ?? 0) >= 400 ? 'var(--color-error-red)' : (ep.statusCode ?? 0) >= 300 ? 'var(--color-warning-yellow)' : 'var(--color-success-green)',
                    }}>
                      {ep.statusCode}
                    </span>
                  )}
                  {(ep.params ?? []).length > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-medium-gray)' }}>
                      params: {(ep.params ?? []).join(', ')}
                    </span>
                  )}
                  {Object.entries(ep.riskCounts ?? {}).filter(([, n]) => n > 0).map(([risk]) => (
                    <span key={risk} className={`severity-badge severity-${risk.toLowerCase()}`}>{risk}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="panel" style={{ padding: '0.65rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <span className="material-symbols-outlined" style={{ color: 'var(--color-lavender)', opacity: 0.8, fontSize: '1.15rem' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-bright-gray)' }}>{value}</div>
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-eyebrow)', color: 'var(--color-medium-gray)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-eyebrow)', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}
