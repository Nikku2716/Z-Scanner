import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Comparison, type Scan } from '../api/client';

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
        <div className="panel" style={{ color: 'var(--color-ash)', textAlign: 'center', padding: '3.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>hourglass_empty</span>
          Loading scans…
        </div>
      )}

      {!loading && completedScans.length < 2 && (
        <div className="panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.75rem', color: 'var(--color-stone)', display: 'block', marginBottom: '1rem' }}>compare_arrows</span>
          <p style={{ color: 'var(--color-ash)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>At least two completed scans are required for comparison.</p>
          <Link to="/scan/new"><button className="primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '10px 24px', fontSize: '14.5px', fontWeight: 500, minWidth: '160px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span>
            Launch a Scan
          </button></Link>
        </div>
      )}

      {!loading && completedScans.length >= 2 && (
        <>
          <form className="panel" onSubmit={(e) => { e.preventDefault(); runCompare(); }} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Select label="Base scan" value={baseId} onChange={setBaseId} scans={completedScans} exclude={targetId} />
            <span className="material-symbols-outlined" style={{ color: 'var(--color-ink)' }}>arrow_forward</span>
            <Select label="Target scan" value={targetId} onChange={setTargetId} scans={completedScans} exclude={baseId} />
            <button className="primary" disabled={comparing || baseId === targetId} style={{ marginTop: 'auto', height: '42px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>{comparing ? 'hourglass_empty' : 'difference'}</span>
              {comparing ? 'Comparing…' : 'Compare'}
            </button>
          </form>

          {error && (
            <div className="panel" style={{ color: 'var(--color-vermillion)', borderColor: 'rgba(232, 64, 13, 0.25)', background: '#fff5f5' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
                {error}
              </span>
            </div>
          )}

          {result && (
            <>
              <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.5rem', padding: '2rem', flexWrap: 'wrap' }}>
                <ScoreBox score={result.baseScore} label="BASE SCORE" />
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--color-stone)' }}>trending_flat</span>
                <ScoreBox score={result.targetScore} label="TARGET SCORE" />
                <div style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: 'var(--radius-pills)',
                  background: result.scoreDelta > 0 ? 'var(--color-mint-green)' : result.scoreDelta < 0 ? 'var(--color-petal-pink)' : 'var(--color-pearl)',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--color-ink)',
                }}>
                  {result.scoreDelta > 0 ? `+${result.scoreDelta}` : result.scoreDelta}
                </div>
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
    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 220 }}>
      <span style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-eyebrow)', color: 'var(--color-ash)', fontWeight: 600 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: '#ffffff',
          color: 'var(--color-ink)',
          border: '1px solid rgba(17, 17, 17, 0.12)',
          borderRadius: 'var(--radius-buttons)',
          padding: '0.6rem 0.75rem',
          fontFamily: 'var(--font-inter)',
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

function ScoreBox({ score, label }: { score: number; label: string }) {
  const c = score >= 80 ? '#15803d' : score >= 50 ? '#b45309' : 'var(--color-vermillion)';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.4rem', fontWeight: 800, color: c, lineHeight: 1 }}>{score}</div>
      <div style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-eyebrow)', color: 'var(--color-ash)', letterSpacing: 'var(--tracking-eyebrow)', textTransform: 'uppercase', fontWeight: 600, marginTop: '0.35rem' }}>{label}</div>
    </div>
  );
}

function CountCard({ label, count, tone, icon }: { label: string; count: number; tone: 'good' | 'bad' | 'warn' | 'neutral'; icon: string }) {
  const toneColors = {
    good: { icon: '#15803d', bg: 'var(--color-mint-green)' },
    bad: { icon: '#9f1239', bg: 'var(--color-petal-pink)' },
    warn: { icon: '#854d0e', bg: 'var(--color-canary-yellow)' },
    neutral: { icon: 'var(--color-ink)', bg: 'var(--color-pearl)' },
  };
  const t = toneColors[tone];

  return (
    <div className="panel" style={{ padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span className="material-symbols-outlined" style={{
        width: 36, height: 36, borderRadius: 'var(--radius-buttons)',
        background: t.bg, color: t.icon, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.2rem',
      }}>{icon}</span>
      <div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1, color: 'var(--color-ink)' }}>{count}</div>
        <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.68rem', color: 'var(--color-ash)', fontWeight: 500, marginTop: '0.2rem' }}>{label}</div>
      </div>
    </div>
  );
}

function FindingList({ title, findings, emptyText }: { title: string; findings: Comparison['newFindings']; emptyText: string }) {
  if (findings.length === 0) {
    return (
      <div className="panel" style={{ marginTop: '0.75rem' }}>
        <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-eyebrow)', color: 'var(--color-ash)', margin: '0 0 0.4rem', fontWeight: 600 }}>{title}</h3>
        <p style={{ color: 'var(--color-ash)', fontSize: '0.85rem' }}>{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="panel" style={{ marginTop: '0.75rem' }}>
      <h3 style={{ fontFamily: 'var(--font-inter)', fontSize: 'var(--text-eyebrow)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-eyebrow)', color: 'var(--color-ash)', margin: '0 0 0.75rem', fontWeight: 600 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {findings.map((f) => (
          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.4rem 0', borderBottom: '1px solid rgba(17, 17, 17, 0.06)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-ink)' }}>{f.name}</span>
            <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--color-ash)', fontWeight: 500 }}>
              {f.risk} · {f.affectedCount} endpoint{f.affectedCount !== 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
