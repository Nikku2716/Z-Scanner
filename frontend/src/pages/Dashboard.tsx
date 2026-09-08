import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Scan } from '../api/client';
import SeverityBadge from '../components/SeverityBadge';
import gsap from 'gsap';

type FilterTab = 'all' | 'active' | 'complete' | 'failed';

export default function Dashboard() {
  const navigate = useNavigate();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [stopping, setStopping] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    api.listScans()
      .then((data) => {
        setScans(data);
        setError('');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to fetch scans'))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Polling: Auto-refresh every 3.5 seconds if there are active scans
  useEffect(() => {
    const hasActive = scans.some((s) => s.status === 'running' || s.status === 'pending');
    if (!hasActive) return;

    const interval = setInterval(() => {
      load(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [scans, load]);

  // GSAP animations
  useEffect(() => {
    if (loading || !containerRef.current) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-dash-stat',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-dash-card',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, delay: 0.1, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [loading]);

  const metrics = useMemo(() => {
    const total = scans.length;
    const active = scans.filter((s) => s.status === 'running' || s.status === 'pending').length;
    const completed = scans.filter((s) => s.status === 'complete').length;
    let highAlerts = 0;
    for (const scan of scans) {
      if (scan.alerts) {
        highAlerts += scan.alerts.filter((a) => a.risk === 'High').length;
      }
    }
    return { total, active, completed, highAlerts };
  }, [scans]);

  const filteredScans = useMemo(() => {
    let result = scans;

    if (activeTab === 'active') {
      result = result.filter((s) => s.status === 'running' || s.status === 'pending');
    } else if (activeTab === 'complete') {
      result = result.filter((s) => s.status === 'complete');
    } else if (activeTab === 'failed') {
      result = result.filter((s) => s.status === 'failed' || s.status === 'stopped');
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      result = result.filter((scan) => {
        return [
          scan.target,
          scan.config?.mode,
          scan.status,
          scan.progress?.message,
          scan.progress?.phase,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      });
    }

    return result;
  }, [scans, activeTab, searchTerm]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scan and its reports?')) return;
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

  async function handleStop(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setStopping(id);
    try {
      await api.stopScan(id);
      load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stop failed');
    } finally {
      setStopping(null);
    }
  }

  function formatDate(isoString: string) {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  }

  return (
    <div ref={containerRef}>
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Dashboard</h1>
          <p>Real-time telemetry, vulnerability overview, and scan inventory</p>
        </div>
        <Link to="/scan/new">
          <button className="primary">
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            New Scan
          </button>
        </Link>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem', marginBottom: '1rem' }}>
        <div className="panel gsap-dash-stat" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-medium-gray)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Total Scans
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-lavender)' }}>
              radar
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-bright-gray)', lineHeight: 1, marginTop: '4px' }}>
            {metrics.total}
          </div>
        </div>

        <div className="panel gsap-dash-stat" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-medium-gray)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Active Scans
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: metrics.active > 0 ? 'var(--color-amethyst)' : 'var(--color-muted-gray)' }}>
              autorenew
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: metrics.active > 0 ? 'var(--color-amethyst)' : 'var(--color-bright-gray)', lineHeight: 1, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {metrics.active}
            {metrics.active > 0 && <span className="pulse-dot" style={{ width: '6px', height: '6px' }} />}
          </div>
        </div>

        <div className="panel gsap-dash-stat" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-medium-gray)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              Completed Scans
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-success-green)' }}>
              task_alt
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-bright-gray)', lineHeight: 1, marginTop: '4px' }}>
            {metrics.completed}
          </div>
        </div>

        <div className="panel gsap-dash-stat" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '62px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-medium-gray)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
              High Risk Alerts
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: metrics.highAlerts > 0 ? 'var(--color-error-red)' : 'var(--color-muted-gray)' }}>
              warning
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: metrics.highAlerts > 0 ? 'var(--color-error-red)' : 'var(--color-bright-gray)', lineHeight: 1, marginTop: '4px' }}>
            {metrics.highAlerts}
          </div>
        </div>
      </div>

      {/* Search & Tabs Toolbar */}
      <div className="panel toolbar" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {(['all', 'active', 'complete', 'failed'] as const).map((tab) => {
            const labelMap = { all: 'All Scans', active: 'Active', complete: 'Completed', failed: 'Failed/Stopped' };
            const countMap = {
              all: scans.length,
              active: metrics.active,
              complete: metrics.completed,
              failed: scans.filter((s) => s.status === 'failed' || s.status === 'stopped').length,
            };
            const isSelected = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={isSelected ? 'primary' : 'ghost'}
                style={{
                  fontSize: '12.5px',
                  padding: '4px 10px',
                  minHeight: '30px',
                  height: '30px',
                }}
              >
                {labelMap[tab]} ({countMap[tab]})
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '320px', minWidth: '200px' }}>
          <div className="search-panel" style={{ width: '100%', padding: '0.35rem 0.75rem', minHeight: '32px' }}>
            <span className="material-symbols-outlined search-icon" style={{ fontSize: '1rem' }}>search</span>
            <input
              className="search-input"
              type="search"
              placeholder="Search target or mode…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search scans"
              style={{ fontSize: '13px' }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ padding: 0, minHeight: 'auto', height: 'auto', border: 'none', background: 'none', color: 'var(--color-muted-gray)' }}
                aria-label="Clear search"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="panel" style={{ color: 'var(--color-error-red)', borderColor: 'rgba(248, 113, 113, 0.25)', background: 'rgba(248, 113, 113, 0.1)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
            {error}
          </span>
          <button className="ghost" onClick={() => load()} style={{ padding: '3px 8px', fontSize: '12px' }}>Retry</button>
        </div>
      )}

      {loading && (
        <div className="panel" style={{ color: 'var(--color-medium-gray)', textAlign: 'center', padding: '3.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>hourglass_empty</span>
          Loading scan telemetry…
        </div>
      )}

      {!loading && scans.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.75rem', color: 'var(--color-muted-gray)', display: 'block', marginBottom: '0.75rem' }}>radar</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-bright-gray)', marginBottom: '0.35rem' }}>No scans recorded yet</h3>
          <p style={{ color: 'var(--color-medium-gray)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>Launch your first reconnaissance scan against any target URL.</p>
          <Link to="/scan/new">
            <button className="primary">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>rocket_launch</span>
              Start First Scan
            </button>
          </Link>
        </div>
      )}

      {!loading && scans.length > 0 && filteredScans.length === 0 && (
        <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: 'var(--color-muted-gray)', display: 'block', marginBottom: '0.75rem' }}>search_off</span>
          <p style={{ color: 'var(--color-medium-gray)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            No scans match your current filter {searchTerm ? `"${searchTerm}"` : ''}.
          </p>
          <button className="ghost" onClick={() => { setSearchTerm(''); setActiveTab('all'); }}>
            Reset Filters
          </button>
        </div>
      )}

      {/* Scans List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {filteredScans.map((scan) => {
          const highCount = scan.alerts?.filter((a) => a.risk === 'High').length ?? 0;
          const medCount = scan.alerts?.filter((a) => a.risk === 'Medium').length ?? 0;
          const lowCount = scan.alerts?.filter((a) => a.risk === 'Low').length ?? 0;
          const isRunning = scan.status === 'running' || scan.status === 'pending';
          const isDeleting = deleting === scan.id;
          const isStopping = stopping === scan.id;
          const isComplete = scan.status === 'complete';
          const reportLink = isComplete ? `/report/${scan.id}` : `/scan/${scan.id}`;

          return (
            <div
              key={scan.id}
              className={`card status-${scan.status} gsap-dash-card`}
              style={{
                opacity: isDeleting ? 0.4 : 1,
                padding: '1rem 1.25rem',

                transition: 'border-color var(--transition), background var(--transition)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Target info & Metadata */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="mode-tag">{scan.config?.mode || 'quick'}</span>
                    <button
                      onClick={() => navigate(reportLink)}
                      style={{
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--color-bright-gray)',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        wordBreak: 'break-all',
                      }}
                      title="Open scan details"
                    >
                      {scan.target}
                    </button>
                    <StatusPill status={scan.status} />
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.85rem', fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--color-medium-gray)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: 'var(--color-muted-gray)' }}>schedule</span>
                      {formatDate(scan.createdAt)}
                    </span>

                    {isComplete && (
                      <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <SeverityBadge severity="High" count={highCount} showCount />
                          <SeverityBadge severity="Medium" count={medCount} showCount />
                          {lowCount > 0 && <SeverityBadge severity="Low" count={lowCount} showCount />}
                        </span>
                        <span>·</span>
                        <span>{scan.alerts?.length ?? 0} total alert{scan.alerts?.length !== 1 ? 's' : ''}</span>
                      </>
                    )}

                    {isRunning && (
                      <span style={{ color: 'var(--color-amethyst)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="pulse-dot" />
                        {scan.progress?.phase ? `Phase: ${scan.progress.phase} · ` : ''}{scan.progress?.message || 'Scanning...'}
                      </span>
                    )}

                    {scan.status === 'failed' && scan.error && (
                      <span style={{ color: 'var(--color-error-red)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '0.85rem' }}>error</span>
                        {scan.error}
                      </span>
                    )}
                  </div>

                  {/* Active Scan Progress Bar */}
                  {isRunning && scan.progress && (
                    <div style={{ marginTop: '0.65rem', maxWidth: '400px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-muted-gray)', marginBottom: '3px' }}>
                        <span>Spider: {scan.progress.spiderPercent ?? 0}%</span>
                        <span>Active: {scan.progress.activePercent ?? 0}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.max(scan.progress.spiderPercent ?? 0, scan.progress.activePercent ?? 0)}%`,
                            height: '100%',
                            background: 'var(--color-amethyst)',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                  {isComplete && (
                    <>
                      <Link to={`/report/${scan.id}`}>
                        <button className="primary" style={{ height: '30px', fontSize: '12.5px', padding: '4px 12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>assessment</span>
                          Report
                        </button>
                      </Link>
                      <Link to={`/scan/${scan.id}/surface`}>
                        <button className="ghost" style={{ height: '30px', fontSize: '12.5px', padding: '4px 8px' }} title="Attack Surface">
                          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>hub</span>
                        </button>
                      </Link>
                      <Link to={`/scan/${scan.id}/analytics`}>
                        <button className="ghost" style={{ height: '30px', fontSize: '12.5px', padding: '4px 8px' }} title="Security Overview">
                          <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>monitoring</span>
                        </button>
                      </Link>
                    </>
                  )}

                  {isRunning && (
                    <>
                      <Link to={`/scan/${scan.id}`}>
                        <button className="primary" style={{ height: '30px', fontSize: '12.5px', padding: '4px 12px' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>terminal</span>
                          Live View
                        </button>
                      </Link>
                      <button
                        className="danger"
                        onClick={(e) => handleStop(e, scan.id)}
                        disabled={isStopping}
                        style={{ height: '30px', fontSize: '12.5px', padding: '4px 10px' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>stop</span>
                        {isStopping ? 'Stopping…' : 'Stop'}
                      </button>
                    </>
                  )}

                  {!isRunning && (
                    <button
                      className="ghost"
                      onClick={(e) => handleDelete(e, scan.id)}
                      disabled={isDeleting}
                      title="Delete scan"
                      style={{
                        height: '30px',
                        width: '30px',
                        padding: 0,
                        color: 'var(--color-muted-gray)',
                        borderRadius: 'var(--radius-buttons)',
                      }}
                      aria-label="Delete scan"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                        {isDeleting ? 'hourglass_empty' : 'delete'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { icon: string; className: string; label: string }> = {
    running:  { icon: '', className: 'running', label: 'Running' },
    pending:  { icon: 'sync', className: 'pending', label: 'Pending' },
    complete: { icon: 'task_alt', className: 'complete', label: 'Complete' },
    failed:   { icon: 'block', className: 'failed', label: 'Failed' },
    stopped:  { icon: 'stop_circle', className: 'stopped', label: 'Stopped' },
  };
  const c = config[status] ?? { icon: 'help', className: '', label: status };

  return (
    <span className={`status-pill ${c.className}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
      {status === 'running' ? (
        <span className="pulse-dot" />
      ) : (
        <span className="material-symbols-outlined" style={{ fontSize: '0.75rem' }}>{c.icon}</span>
      )}
      {c.label}
    </span>
  );
}
