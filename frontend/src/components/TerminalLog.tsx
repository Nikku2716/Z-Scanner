import { useEffect, useRef } from 'react';
import type { LogEntry } from '../api/client';

interface Props {
  logs: LogEntry[];
}

const levelColor: Record<string, string> = {
  info: 'rgba(255, 255, 255, 0.75)',
  success: 'var(--color-mint-green)',
  warn: 'var(--color-canary-yellow)',
  error: 'var(--color-petal-pink)',
};

export default function TerminalLog({ logs }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      style={{
        background: 'var(--color-midnight-indigo)',
        border: '1px solid rgba(17, 17, 17, 0.1)',
        borderRadius: 'var(--radius-cards)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-product-mockup)',
      }}
    >
      {/* Terminal header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.65rem 1rem',
        background: 'rgba(255, 255, 255, 0.06)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff5f56' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffbd2e' }} />
        <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#27c93f' }} />
        <span style={{
          marginLeft: '0.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--color-soft-violet)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Live Scanner Output
        </span>
      </div>

      {/* Terminal body */}
      <div style={{
        padding: '0.85rem',
        height: '320px',
        overflowY: 'auto',
        fontSize: '0.75rem',
        lineHeight: 1.7,
        fontFamily: 'var(--font-mono)',
      }}>
        {logs.length === 0 && (
          <div style={{ color: 'rgba(255, 255, 255, 0.45)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>hourglass_empty</span>
            Waiting for scan telemetry…
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{
            color: levelColor[log.level] ?? 'rgba(255, 255, 255, 0.75)',
            padding: '1px 0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.35)', userSelect: 'none', marginRight: '0.5rem' }}>
              [{new Date(log.timestamp).toLocaleTimeString()}]
            </span>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
