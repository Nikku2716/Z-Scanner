import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type AttackSurface, type Endpoint } from '../api/client';

const METHOD_PASTELS: Record<string, { bg: string; color: string }> = {
  GET: { bg: 'var(--color-aqua)', color: 'var(--color-ink)' },
  POST: { bg: 'var(--color-canary-yellow)', color: '#854d0e' },
  PUT: { bg: 'var(--color-mint-green)', color: '#14532d' },
  DELETE: { bg: 'var(--color-petal-pink)', color: '#9f1239' },
  PATCH: { bg: 'var(--color-soft-violet)', color: '#3730a3' },
};

function MethodTag({ method }: { method: string }) {
  const styling = METHOD_PASTELS[method] ?? { bg: 'var(--color-pearl)', color: 'var(--color-ink)' };
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.68rem',
      fontWeight: 600,
      letterSpacing: '0.04em',
      color: styling.color,
      background: styling.bg,
      borderRadius: 'var(--radius-small)',
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
        <div className="panel" style={{ color: 'var(--color-ash)', textAlign: 'center', padding: '3.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>hourglass_empty</span>
          Loading attack surface…
        </div>
      )}

      {error && (
        <div className="panel" style={{ color: 'var(--color-vermillion)', borderColor: 'rgba(232, 64, 13, 0.25)', background: '#fff5f5' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
            {error}
          </span>
          <Link to="/dashboard"><button className="pearl" style={{ marginTop: '1rem' }}>Back to Dashboard</button></Link>
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
                background: '#ffffff',
                color: 'var(--color-ink)',
                border: '1px solid rgba(17, 17, 17, 0.12)',
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

          {loading && <p style={{ color: 'var(--color-ash)', fontFamily: 'var(--font-inter)', fontSize: '0.85rem' }}>Filtering…</p>}

          {!loading && surface.endpoints.length === 0 && (
            <div className="panel" style={{ textAlign: 'center', padding: '3.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--color-stone)' }}>search_off</span>
              <p style={{ color: 'var(--color-ash)' }}>No endpoints match the current filters.</p>
              <button className="pearl" onClick={() => { setSearch(''); setMethodFilter(''); }}>Clear filters</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {surface.endpoints.map((ep: Endpoint) => (
              <div key={ep.id || ep.url + ep.method} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <MethodTag method={ep.method} />
                  <code style={{ fontSize: '0.85rem', wordBreak: 'break-all', flex: 1, color: 'var(--color-ink)' }}>{ep.path}</code>
                  {(ep.statusCode ?? 0) > 0 && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: (ep.statusCode ?? 0) >= 400 ? 'var(--color-vermillion)' : (ep.statusCode ?? 0) >= 300 ? '#b45309' : '#15803d',
                    }}>
                      {ep.statusCode}
                    </span>
                  )}
                  {(ep.params ?? []).length > 0 && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-ash)' }}>
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
      <span className="material-symbols-outlined" style={{ color: 'var(--color-ink)', opacity: 0.8 }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.35rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-ink)' }}>{value}</div>
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-eyebrow)', color: 'var(--color-ash)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-eyebrow)', fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}
