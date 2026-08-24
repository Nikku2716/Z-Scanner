import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Scan } from '../api/client';
import gsap from 'gsap';

export default function Dashboard() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    api.listScans()
      .then(setScans)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // GSAP animations — run after data loads
  useEffect(() => {
    if (loading || !containerRef.current) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-dash-header > *',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-dash-toolbar',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, delay: 0.1, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-dash-card',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, delay: 0.15, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading]);

  const filteredScans = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return scans;

    return scans.filter((scan) => {
      return [scan.target, scan.config.mode, scan.status, scan.progress.message]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [searchTerm, scans]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this scan and its results?')) return;
    setDeleting(id);
    try {
      await api.deleteScan(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div ref={containerRef}>
      <header className="page-header gsap-dash-header">
        <h1>Dashboard</h1>
        <p>Scan history and quick launch</p>
      </header>

      <div className="search-shell">
        <form className="panel search-panel" onSubmit={(e) => e.preventDefault()}>
          <span className="material-symbols-outlined search-icon">search</span>
          <input
            className="search-input"
            type="search"
            placeholder="Search scans, modes, or status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search scans"
          />
        </form>
      </div>

      <div className="panel toolbar gsap-dash-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-label)', fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="pulse-dot" />
            <span style={{ color: 'var(--primary)' }}>
              {filteredScans.filter(s => s.status === 'running' || s.status === 'pending').length} active
            </span>
          </span>
          <span style={{ color: 'var(--color-steel)' }}>·</span>
          <span>{filteredScans.length} total scan{filteredScans.length !== 1 ? 's' : ''}</span>
        </div>
        <Link to="/scan/new">
          <button className="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
            Launch Scan
          </button>
        </Link>
      </div>

      {loading && (
        <div className="panel" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}>hourglass_empty</span>
          Loading scans…
        </div>
      )}

      {error && (
        <div className="panel" style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.25)', borderLeft: '3px solid var(--error)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
            {error}
          </span>
        </div>
      )}

      {!loading && scans.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-steel)', display: 'block', marginBottom: '1rem' }}>radar</span>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>No scans yet. Point BlackHawk at a target to begin.</p>
          <Link to="/scan/new"><button className="primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>add</span>
            Start First Scan
          </button></Link>
        </div>
      )}

      {!loading && scans.length > 0 && filteredScans.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-steel)', display: 'block', marginBottom: '1rem' }}>search_off</span>
          <p style={{ color: 'var(--on-surface-variant)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>No scans match "{searchTerm.trim()}". Try a different target, mode, or status.</p>
          <button className="ghost" onClick={() => setSearchTerm('')} style={{ margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>close</span>
            Clear search
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.75rem' }}>
        {filteredScans.map((scan) => {
          const highCount = scan.alerts.filter((a) => a.risk === 'High').length;
          const medCount = scan.alerts.filter((a) => a.risk === 'Medium').length;
          const isRunning = scan.status === 'running' || scan.status === 'pending';
          const isDeleting = deleting === scan.id;
          const isComplete = scan.status === 'complete';
          const link = isComplete ? `/report/${scan.id}` : `/scan/${scan.id}`;
          const statusClass = `status-${scan.status}`;

          return (
            <Link key={scan.id} to={link} style={{ textDecoration: 'none', display: 'block', opacity: isDeleting ? 0.4 : 1 }}>
              <div className={`card ${statusClass} gsap-dash-card`}>
                {isRunning && <div className="card-glow-hint" />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                      <span className="mode-tag">{scan.config.mode}</span>
                      <div style={{ fontFamily: 'var(--font-body)', color: 'var(--on-surface)', fontSize: '0.9375rem', fontWeight: 600, wordBreak: 'break-all' }}>
                        {scan.target}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', fontFamily: 'var(--font-label)', fontSize: '0.7rem', color: 'var(--color-mist)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>schedule</span>
                        {new Date(scan.createdAt).toLocaleString()}
                      </span>
                      {isComplete && highCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--error)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.8rem', fontVariationSettings: "'FILL' 1" }}>error</span>
                          High: {highCount}
                        </span>
                      )}
                      {isComplete && medCount > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--tertiary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.8rem', fontVariationSettings: "'FILL' 1" }}>warning</span>
                          Medium: {medCount}
                        </span>
                      )}
                      {isRunning && (
                        <span style={{ color: 'var(--primary)', fontSize: '0.7rem' }}>
                          {scan.progress.message}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                    <StatusPill status={scan.status} />
                    {!isRunning && (
                      <button
                        className="delete-btn ghost"
                        onClick={(e) => handleDelete(e, scan.id)}
                        disabled={isDeleting}
                        title="Delete scan"
                        style={{ padding: '0.35rem', borderRadius: 'var(--radius-full)', lineHeight: 1 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                          {isDeleting ? 'hourglass_empty' : 'delete'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { icon: string; className: string }> = {
    running:  { icon: '', className: 'running' },
    pending:  { icon: 'sync', className: 'pending' },
    complete: { icon: 'task_alt', className: 'complete' },
    failed:   { icon: 'block', className: 'failed' },
    stopped:  { icon: 'stop_circle', className: 'stopped' },
  };
  const c = config[status] ?? { icon: 'help', className: '' };

  return (
    <span className={`status-pill ${c.className}`}>
      {status === 'running' ? (
        <span className="pulse-dot" />
      ) : (
        <span className="material-symbols-outlined" style={{ fontSize: '0.8rem' }}>{c.icon}</span>
      )}
      {status}
    </span>
  );
}
