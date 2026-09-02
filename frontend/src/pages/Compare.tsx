import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Comparison, type Scan } from '../api/client';

function deltaColor(d: number) {
  if (d > 0) return 'var(--success)';
  if (d < 0) return 'var(--error)';
  return 'var(--on-surface-variant)';
}

export default function ComparePage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [baseId, setBaseId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [result, setResult] = useState<Comparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listScans()
      .then((all) => setScans(all.filter((s) => s.status === 'complete')))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load scans'))
      .finally(() => setLoading(false));
  }, []);

  // Default: compare the two most recent completed scans.
  useEffect(() => {
    if (!baseId && !targetId && scans.length >= 2) {
      setBaseId(scans[1].id);
      setTargetId(scans[0].id);
    }
  }, [scans, baseId, targetId]);

  async function runCompare() {
    if (!baseId || !targetId || baseId === targetId) return;
    setComparing(true);
    setError('');
    try {
      setResult(await api.compareScans(baseId, targetId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Comparison failed');
      setResult(null);
    } finally {
      setComparing(false);
    }
  }

  const completedScans = useMemo(() => scans, [scans]);

  return (
    <div>
      <header className="page-header">
        <h1>Scan Comparison</h1>
        <p>Diff two completed scans — new, fixed, and persistent findings</p>
      </header>

      {loading && (
        <div className="panel" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', padding: '3rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.4 }}>hourglass_empty</span>
          Loading scans…
        </div>
      )}

      {!loading && completedScans.length < 2 && (
        <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.75rem', color: 'var(--color-stone)', display: 'block', marginBottom: '1rem' }}>compare_arrows</span>
          <p style={{ color: 'var(--color-graphite)', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>At least two completed scans are required for comparison.</p>
          <Link to="/scan/new"><button className="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '10px 26px', fontSize: '15px', fontWeight: 500, minWidth: '170px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span>
            Launch a Scan
          </button></Link>
        </div>
      )}

      {!loading && completedScans.length >= 2 && (
        <>
          <form className="panel" onSubmit={(e) => { e.preventDefault(); runCompare(); }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Select label="Base scan" value={baseId} onChange={setBaseId} scans={completedScans} exclude={targetId} />
            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>arrow_forward</span>
            <Select label="Target scan" value={targetId} onChange={setTargetId} scans={completedScans} exclude={baseId} />
            <button className="primary" disabled={comparing || baseId === targetId}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>{comparing ? 'hourglass_empty' : 'difference'}</span>
              {comparing ? 'Comparing…' : 'Compare'}
            </button>
          </form>

          {error && (
            <div className="panel" style={{ color: 'var(--color-vermillion)', borderColor: 'rgba(227, 45, 20, 0.25)', background: '#fef2f2' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
                {error}
              </span>
            </div>
          )}

          {result && (
            <>
              <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '1.5rem', flexWrap: 'wrap' }}>
                <ScoreBox score={result.baseScore} />
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.5 }}>trending_flat</span>
                <ScoreBox score={result.targetScore} />
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: deltaColor(result.scoreDelta) }}>
                  {result.scoreDelta > 0 ? `+${result.scoreDelta}` : result.scoreDelta}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', margin: '1rem 0' }}>
                <CountCard label="New vulnerabilities" count={result.newFindings.length} tone="bad" icon="report" />
                <CountCard label="Fixed vulnerabilities" count={result.fixedFindings.length} tone="good" icon="task_alt" />
                <CountCard label="Persistent vulnerabilities" count={result.persistentFindings.length} tone="warn" icon="schedule" />
                <CountCard label="New endpoints" count={result.newEndpoints.length} tone="neutral" icon="add_circle" />
                <CountCard label="Removed endpoints" count={result.removedEndpoints.length} tone="neutral" icon="do_not_disturb_on" />
              </div>

              <FindingList title={`New Vulnerabilities (${result.newFindings.length})`} findings={result.newFindings} emptyText="No new vulnerabilities." />
              <FindingList title={`Fixed Vulnerabilities (${result.fixedFindings.length})`} findings={result.fixedFindings} emptyText="Nothing was fixed in this window." />
              <FindingList title={`Persistent Vulnerabilities (${result.persistentFindings.length})`} findings={result.persistentFindings} emptyText="No persistent findings." />
            </>
          )}
        </>
      )}
    </div>
  );
}

function Select({ label, value, onChange, scans, exclude }: {
  label: string; value: string; onChange: (v: string) => void; scans: Scan[]; exclude?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 220 }}>
      <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--on-surface-variant)' }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'var(--color-pure-white, #ffffff)',
          color: 'rgba(0, 0, 0, 0.95)',
          border: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: 'var(--radius-buttons, 8px)',
          padding: '0.55rem 0.75rem',
          fontFamily: 'var(--font-notioninter)',
          fontSize: '0.85rem',
        }}
      >
        <option value="" disabled>Select…</option>
        {scans.filter((s) => s.id !== exclude).map((s) => (
          <option key={s.id} value={s.id}>{new Date(s.createdAt).toLocaleString()} — {s.target}</option>
        ))}
      </select>
    </label>
  );
}

function ScoreBox({ score }: { score: number }) {
  const c = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.2rem', fontWeight: 800, color: c, lineHeight: 1 }}>{score}</div>
      <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.62rem', color: 'var(--on-surface-variant)' }}>SECURITY SCORE</div>
    </div>
  );
}

function CountCard({ label, count, tone, icon }: { label: string; count: number; tone: 'good' | 'bad' | 'warn' | 'neutral'; icon: string }) {
  const colors = { good: 'var(--success)', bad: 'var(--error)', warn: 'var(--warning)', neutral: 'var(--on-surface-variant)' };
  return (
    <div className="panel" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <span className="material-symbols-outlined" style={{ color: colors[tone] }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>{count}</div>
        <div style={{ fontFamily: 'var(--font-label)', fontSize: '0.62rem', color: 'var(--on-surface-variant)' }}>{label}</div>
      </div>
    </div>
  );
}

function FindingList({ title, findings, emptyText }: { title: string; findings: Comparison['newFindings']; emptyText: string }) {
  if (findings.length === 0) {
    return (
      <div className="panel" style={{ marginTop: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-label)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', margin: '0 0 0.4rem' }}>{title}</h3>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="panel" style={{ marginTop: '0.75rem' }}>
      <h3 style={{ fontFamily: 'var(--font-label)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', margin: '0 0 0.5rem' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {findings.map((f) => (
          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{f.name}</span>
            <span style={{ fontFamily: 'var(--font-label)', fontSize: '0.7rem', color: 'var(--on-surface-variant)' }}>
              {f.risk} · {f.affectedCount} endpoint{f.affectedCount !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
