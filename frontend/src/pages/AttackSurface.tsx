import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type AttackSurface, type Endpoint } from '../api/client';

const METHOD_COLORS: Record<string, string> = {
  GET: 'var(--primary)',
  POST: 'var(--tertiary)',
  PUT: '#8a6d00',
  DELETE: 'var(--error)',
  PATCH: '#a78bfa',
};

function MethodTag({ method }: { method: string }) {
  const color = METHOD_COLORS[method] ?? 'var(--color-steel)';
  return (
    <span style={{
      fontFamily: 'var(--font-label)',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.05em',
      color,
      border: `1px solid ${color}`,
      borderRadius: '4px',
      padding: '0.1rem 0.45rem',
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
        <div className="panel" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}>hourglass_empty</span>
          Loading attack surface…
        </div>
      )}

      {error && (
        <div className="panel" style={{ color: 'var(--error)', borderColor: 'rgba(207,34,46,0.25)', borderLeft: '3px solid var(--error)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
            {error}
          </span>
          <Link to="/dashboard"><button className="ghost" style={{ marginTop: '1rem' }}>Back to Dashboard</button></Link>
        </div>
      )}

      {surface && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            <StatCard label="Endpoints" value={String(surface.total)} icon="hub" />
            {methods.slice(0, 3).map(([m, n]) => (
              <StatCard key={m} label={m} value={String(n)} icon="swap_horiz" />
            ))}
            {(['High', 'Medium', 'Low'] as const).map((risk) => surface.riskTotals[risk] > 0 && (
              <StatCard key={risk} label={`${risk} risk`} value={String(surface.riskTotals[risk])} icon="warning" />
            ))}
          </div>

          <form className="panel search-panel" onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
                background: 'var(--surface-container)',
                color: 'var(--on-surface)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.6rem',
                fontFamily: 'var(--font-label)',
                fontSize: '0.8rem',
              }}
            >
              <option value="">All methods</option>
              {methods.map(([m]) => <option key={m} value={m}>{m}</option>)}
            </select>
          </form>

          {loading && <p style={{ color: 'var(--on-surface-variant)', fontFamily: 'var(--font-label)' }}>Filtering…</p>}

          {!loading && surface.endpoints.length === 0 && (
            <div className="panel" style={{ textAlign: 'center', padding: '3rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--color-steel)' }}>search_off</span>
              <p style={{ color: 'var(--on-surface-variant)' }}>No endpoints match the current filters.</p>
              <button className="ghost" onClick={() => { setSearch(''); setMethodFilter(''); }}>Clear filters</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {surface.endpoints.map((ep: Endpoint) => (
              <div key={ep.id || ep.url + ep.method} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <MethodTag method={ep.method} />
                  <code style={{ fontSize: '0.85rem', wordBreak: 'break-all', flex: 1 }}>{ep.path}</code>
                  {(ep.statusCode ?? 0) > 0 && (
                    <span style={{
                      fontFamily: 'var(--font-label)',
                      fontSize: '0.7rem',
                      color: (ep.statusCode ?? 0) >= 400 ? 'var(--error)' : (ep.statusCode ?? 0) >= 300 ? '#8a6d00' : 'var(--success)',
                    }}>
                      {ep.statusCode}
                    </span>
                  )}
                  {(ep.params ?? []).length > 0 && (
                    <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>
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
    <div className="panel" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', opacity: 0.8 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.65rem', color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      </div>
    </div>
  );
}
