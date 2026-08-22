import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type LogEntry, type Scan } from '../api/client';
import ProgressBar from '../components/ProgressBar';
import TerminalLog from '../components/TerminalLog';
import gsap from 'gsap';

export default function ScanProgress() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState('');
  const [stopping, setStopping] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    api.getStatus(id)
      .then(setScan)
      .catch((e) => setError(e.message));

    const ws = new WebSocket(api.wsUrl(id));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.scan) setScan(msg.scan);
      if (msg.log) setLogs((prev) => [...prev, msg.log]);
      if (msg.logs) setLogs(msg.logs);
    };
    ws.onerror = () => {
      const interval = setInterval(() => {
        api.getStatus(id).then(setScan).catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    };

    return () => ws.close();
  }, [id]);

  useEffect(() => {
    if (!scan || !containerRef.current) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-prog-header > *',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
      gsap.fromTo(
        '.gsap-prog-grid > *',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, delay: 0.1, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [scan?.id]);

  useEffect(() => {
    if (scan?.status === 'complete') {
      navigate(`/report/${scan.id}`, { replace: true });
    }
  }, [scan, navigate]);

  async function handleStop() {
    if (!id) return;
    setStopping(true);
    try {
      await api.stopScan(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stop failed');
    } finally {
      setStopping(false);
    }
  }

  if (error && !scan) {
    return (
      <div className="panel" style={{ color: 'var(--error)', borderLeft: '3px solid var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>error</span>
        {error}
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="panel" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', padding: '3rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}>hourglass_empty</span>
        Loading scan…
      </div>
    );
  }

  const isRunning = scan.status === 'running' || scan.status === 'pending';
  const phase = scan.progress.phase;

  return (
    <div ref={containerRef}>
      <header className="page-header gsap-prog-header">
        <h1>Scan Progress</h1>
        <p style={{ wordBreak: 'break-all' }}>{scan.target}</p>
      </header>

      <div className="grid-2 gsap-prog-grid">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.68rem',
              color: 'var(--color-mist)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>timeline</span>
              Phase: <span style={{ color: 'var(--primary)', textTransform: 'none', fontWeight: 600 }}>{phase}</span>
            </div>
            <StatusPill status={scan.status} />
          </div>

          <ProgressBar label="Spider" value={scan.progress.spiderPercent} active={phase === 'spider'} />
          <ProgressBar label="Active Scan" value={scan.progress.activePercent} active={phase === 'active'} />

          {scan.progress.passiveQueue > 0 && (
            <div style={{
              fontFamily: 'var(--font-label)',
              fontSize: '0.72rem',
              color: 'var(--on-surface-variant)',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--tertiary)', display: 'inline-block' }} />
              Passive queue: {scan.progress.passiveQueue} records
            </div>
          )}

          {scan.status === 'complete' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.625rem 0.875rem',
              background: 'var(--color-green-soft)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(217, 119, 87, 0.12)',
              color: 'var(--primary)',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-label)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
              Scan complete — redirecting to report…
            </div>
          )}

          <div style={{
            marginTop: '1rem',
            padding: '0.625rem 0.875rem',
            background: isRunning ? 'var(--color-green-soft)' : 'var(--color-abyss)',
            borderRadius: 'var(--radius)',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-label)',
            color: isRunning ? 'var(--primary)' : 'var(--on-surface-variant)',
            border: `1px solid ${isRunning ? 'rgba(217, 119, 87, 0.12)' : 'var(--outline-variant)'}`,
          }}>
            {scan.progress.message}
          </div>

          {scan.status === 'failed' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.625rem 0.875rem',
              background: 'var(--error-container)',
              borderRadius: 'var(--radius)',
              border: '1px solid rgba(197, 48, 48, 0.15)',
              color: 'var(--error)',
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-label)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>gpp_bad</span>
              {scan.error}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            {isRunning && (
              <button className="danger" onClick={handleStop} disabled={stopping} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>stop_circle</span>
                {stopping ? 'Stopping…' : 'Stop Scan'}
              </button>
            )}
            {scan.status === 'complete' && (
              <Link to={`/report/${scan.id}`} style={{ flex: 1 }}>
                <button className="primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>assessment</span>
                  View Report
                </button>
              </Link>
            )}
            <Link to="/dashboard">
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>grid_view</span>
                Dashboard
              </button>
            </Link>
          </div>
        </div>

        <div>
          <div style={{
            fontFamily: 'var(--font-label)',
            fontSize: '0.68rem',
            color: 'var(--color-mist)',
            marginBottom: '0.625rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>terminal</span>
            Live Output
          </div>
          <TerminalLog logs={logs} />
        </div>
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
