import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Analytics, type Finding } from '../api/client';

const SEVERITIES = ['High', 'Medium', 'Low', 'Informational'] as const;

const SEVERITY_COLORS: Record<string, string> = {
  High: 'var(--color-error-red)',
  Medium: 'var(--color-warning-yellow)',
  Low: 'var(--color-lavender)',
  Informational: 'var(--color-medium-gray)',
};

function scoreColor(score: number) {
  if (score >= 80) return 'var(--color-success-green)';
  if (score >= 50) return 'var(--color-warning-yellow)';
  return 'var(--color-error-red)';
}

export default function AnalyticsPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Finding | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.getAnalytics(id)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [id]);

  async function openFinding(f: Finding) {
    try {
      setSelected(await api.getFinding(id, f.id));
    } catch {
      setSelected(f);
    }
  }

  if (loading) {
    return (
      <div className="panel" style={{ color: 'var(--color-medium-gray)', textAlign: 'center', padding: '3.5rem' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2rem', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>hourglass_empty</span>
        Computing security analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <header className="page-header"><h1>Security Overview</h1></header>
        <div className="panel" style={{ color: 'var(--color-error-red)', borderColor: 'rgba(248, 113, 113, 0.25)', background: 'rgba(248, 113, 113, 0.1)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
            {error}
          </span>
        </div>
        <Link to="/dashboard"><button className="ghost" style={{ marginTop: '1rem' }}>Back to Dashboard</button></Link>
      </div>
    );
  }

  if (!data) return null;

  const s = data.score;

  return (
    <div>
      <header className="page-header">
        <h1>Security Overview</h1>
        <p>Correlated findings, risk scoring, and most affected endpoints</p>
      </header>

      {/* Score + severity distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{
            width: 132, height: 132, borderRadius: '50%',
            background: `conic-gradient(${scoreColor(s.score)} ${s.score * 3.6}deg, var(--color-surface) 0deg)`,
            display: 'grid', placeItems: 'center',
          }}>
            <div style={{
              width: 104, height: 104, borderRadius: '50%', background: 'var(--color-surface)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-subtle)',
            }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 700, color: scoreColor(s.score), lineHeight: 1 }}>{s.score}</span>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.65rem', color: 'var(--color-medium-gray)', fontWeight: 600 }}>/ 100</span>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-medium-gray)', marginTop: '1rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            BlackHawk Security Score
          </div>
        </div>

        <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {SEVERITIES.map((sev) => {
            const count = s.riskCounts[sev] ?? 0;
            const max = Math.max(1, ...SEVERITIES.map((x) => s.riskCounts[x] ?? 0));
            return (
              <div key={sev} style={{ display: 'grid', gridTemplateColumns: '7rem 1fr 2.5rem', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: SEVERITY_COLORS[sev], fontWeight: 600 }}>{sev}</span>
                <div style={{ height: 8, borderRadius: 'var(--radius-small)', background: 'var(--color-surface)' }}>
                  <div style={{ width: `${(count / max) * 100}%`, height: '100%', borderRadius: 'var(--radius-small)', background: SEVERITY_COLORS[sev], transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-bright-gray)' }}>{count}</span>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.5rem', flexWrap: 'wrap', fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'var(--color-medium-gray)', fontWeight: 500 }}>
            <span>{s.findingCount} correlated finding{s.findingCount !== 1 ? 's' : ''}</span>
            <span>{s.alertCount} raw alert{s.alertCount !== 1 ? 's' : ''}</span>
            <span>{s.affectedEndpoints} affected endpoint{s.affectedEndpoints !== 1 ? 's' : ''}</span>
            <span>{data.totalEndpoints} discovered endpoint{data.totalEndpoints !== 1 ? 's' : ''}</span>
          </div>
          <details style={{ marginTop: 'auto' }}>
            <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: 'var(--color-lavender)', fontWeight: 600 }}>Scoring methodology</summary>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-medium-gray)', lineHeight: 1.5, margin: '0.5rem 0 0' }}>{s.methodology} Not a CVSS score.</p>
          </details>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: repeat_fit(), gap: '0.75rem', marginBottom: '1rem' }}>
        {/* Categories */}
        <div className="panel">
          <h3 style={sectionTitle()}>Vulnerability Categories</h3>
          {s.categories.length === 0 && <Empty text="No vulnerabilities found — clean scan." />}
          {s.categories.map((c) => (
            <div key={c.pluginId + c.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.55rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <div style={{ minWidth: 0 }}>
                <button
                  onClick={() => { const f = data.findings.find((x) => x.name === c.name && x.pluginId === c.pluginId); if (f) openFinding(f); }}
                  style={{ ...linkStyle, color: SEVERITY_COLORS[c.risk] ?? 'var(--color-bright-gray)', fontWeight: 600 }}
                  title="View finding detail"
                >
                  {c.name}
                </button>
                {c.cweId && <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-muted-gray)' }}>CWE-{c.cweId}</span>}
              </div>
              <span style={{ fontWeight: 700, flexShrink: 0, color: 'var(--color-bright-gray)' }}>{c.count}</span>
            </div>
          ))}
        </div>

        {/* Most affected endpoints */}
        <div className="panel">
          <h3 style={sectionTitle()}>Most Affected Endpoints</h3>
          {data.mostAffected.length === 0 && <Empty text="No endpoint has known findings." />}
          {data.mostAffected.map((h) => (
            <div key={h.url} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <code style={{ fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--color-bright-gray)' }}>{h.path}</code>
              <span style={{ fontFamily: 'var(--font-inter)', fontSize: '0.72rem', color: h.risks.High ? 'var(--color-error-red)' : 'var(--color-medium-gray)', fontWeight: 600, flexShrink: 0 }}>
                {h.findingCount} finding{h.findingCount !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Finding detail modal */}
      {selected && (
        <FindingDetail finding={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function repeat_fit() {
  return 'repeat(auto-fit, minmax(300px, 1fr))';
}

function sectionTitle(): React.CSSProperties {
  return {
    fontFamily: 'var(--font-inter)',
    fontSize: 'var(--text-eyebrow)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--tracking-eyebrow)',
    color: 'var(--color-medium-gray)',
    margin: '0 0 0.75rem',
    fontWeight: 600,
  };
}

const linkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  font: 'inherit',
  textAlign: 'left',
};

function Empty({ text }: { text: string }) {
  return <p style={{ color: 'var(--color-medium-gray)', fontSize: '0.85rem', padding: '1rem 0' }}>{text}</p>;
}

function FindingDetail({ finding, onClose }: { finding: Finding; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 60, display: 'grid', placeItems: 'center', padding: '1.5rem' }}>
      <div
        className="panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Finding: ${finding.name}`}
        style={{ maxWidth: 720, width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '2rem', boxShadow: 'var(--shadow-subtle)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <span className={`severity-badge severity-${finding.risk.toLowerCase()}`}>{finding.risk}</span>
            <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-inter)', fontSize: '0.75rem', color: 'var(--color-medium-gray)', fontWeight: 500 }}>
              Confidence: {finding.confidence || 'Unknown'}
            </span>
            <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-bright-gray)' }}>{finding.name}</h2>
          </div>
          <button className="ghost" onClick={onClose} aria-label="Close" style={{ alignSelf: 'flex-start', padding: '0.35rem', borderRadius: 'var(--radius-pills)' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <Section title="Description" body={finding.description} />
        {finding.param && <MetaRow label="Parameter" value={finding.param} />}
        <MetaRow label="Plugin ID" value={finding.pluginId} />
        {(finding.cweid || finding.reference) && <MetaRow label="CWE / Reference" value={[finding.cweid && `CWE-${finding.cweid}`, finding.reference].filter(Boolean).join(' · ')} />}

        <Section title="Affected URLs" body={finding.affectedUrls.join('\n')} mono />

        {finding.alerts.some((a) => a.evidence) && (
          <Section title="Evidence" body={finding.alerts.filter((a) => a.evidence).map((a) => `${a.url}\n${a.evidence}`).join('\n\n')} mono />
        )}

        <Section title="Remediation" body={finding.solution} />
      </div>
    </div>
  );
}

function Section({ title, body, mono }: { title: string; body?: string; mono?: boolean }) {
  if (!body) return null;
  return (
    <div style={{ marginTop: '1.25rem' }}>
      <h4 style={{ ...sectionTitle(), marginBottom: '0.4rem' }}>{title}</h4>
      <pre style={{
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-inter)',
        fontSize: mono ? '0.75rem' : '0.875rem',
        color: 'var(--color-bright-gray)',
        background: 'var(--color-abyss)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '0.75rem 1rem', borderRadius: 'var(--radius-buttons)',
        lineHeight: 1.5,
      }}>{body}</pre>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.8125rem' }}>
      <span style={{ fontFamily: 'var(--font-inter)', color: 'var(--color-medium-gray)', fontWeight: 600, flexShrink: 0 }}>{label}:</span>
      <span style={{ wordBreak: 'break-all', color: 'var(--color-bright-gray)' }}>{value}</span>
    </div>
  );
}
