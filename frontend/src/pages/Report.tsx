import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Scan } from '../api/client';
import AlertTable from '../components/AlertTable';
import SeverityBadge from '../components/SeverityBadge';
import gsap from 'gsap';

const FILTERS = ['all', 'High', 'Medium', 'Low', 'Informational'];

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    api.getReport(id)
      .then(setScan)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    if (!scan || !containerRef.current) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-rep-header > *',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-rep-toolbar',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, delay: 0.1, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-rep-content',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.2, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [scan?.id]);

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
    <div className="panel" style={{ color: 'var(--color-vermillion)', borderColor: 'rgba(232, 64, 13, 0.25)', background: '#fff5f5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>error</span>
      {error}
    </div>
  );

  if (!scan) return (
    <div className="panel" style={{ color: 'var(--color-ash)', textAlign: 'center', padding: '3.5rem' }}>
      <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>hourglass_empty</span>
      Loading report…
    </div>
  );

  const total = scan.alerts.length;

  return (
    <div ref={containerRef}>
      <header className="page-header gsap-rep-header">
        <h1>Scan Report</h1>
        <p style={{ wordBreak: 'break-all' }}>{scan.target} · {scan.config.mode} mode · {new Date(scan.createdAt).toLocaleString()}</p>
      </header>

      <div className="panel toolbar gsap-rep-toolbar" style={{ gap: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(['High', 'Medium', 'Low', 'Informational'] as const).map((risk) => (
            <div key={risk} style={{ textAlign: 'center', minWidth: '60px' }}>
              <SeverityBadge severity={risk} count={counts[risk] ?? 0} showCount />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--color-ash)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>notifications</span>
            {total} alert{total !== 1 ? 's' : ''}
          </span>
          <button onClick={exportJSON} className="pearl" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>download</span>
            JSON
          </button>
          <a href={api.reportHTMLUrl(scan.id)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <button className="pearl" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>code</span>
              HTML
            </button>
          </a>
          <Link to={`/scan/${scan.id}/surface`}>
            <button className="pearl" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>hub</span>
              Attack Surface
            </button>
          </Link>
          <Link to={`/scan/${scan.id}/analytics`}>
            <button className="pearl" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>monitoring</span>
              Overview
            </button>
          </Link>
          <Link to="/dashboard">
            <button className="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>grid_view</span>
              Dashboard
            </button>
          </Link>
        </div>
      </div>

      <div className="panel gsap-rep-content" style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'primary' : 'pearl'}
              style={{ fontSize: '0.8125rem' }}
            >
              {f === 'all' ? 'All' : f}
              {scan && f !== 'all' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          ))}
        </div>
        <AlertTable alerts={scan.alerts} filter={filter} />
      </div>
    </div>
  );
}
