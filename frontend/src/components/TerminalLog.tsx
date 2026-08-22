import { useEffect, useRef } from 'react';
import type { LogEntry } from '../api/client';

interface Props {
  logs: LogEntry[];
}

const levelColor: Record<string, string> = {
  info: '#b0aea5',
  success: '#d97757',
  warn: '#ffbd2e',
  error: '#ff5f57',
};

export default function TerminalLog({ logs }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      style={{
        background: '#141413',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Terminal header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 0.875rem',
        background: '#1c1c1e',
        borderBottom: '1px solid var(--outline-variant)',
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
        <span style={{
          marginLeft: '0.5rem',
          fontFamily: 'var(--font-label)',
          fontSize: '0.6rem',
          color: 'var(--color-mist)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          scan output
        </span>
      </div>

      {/* Terminal body */}
      <div style={{
        padding: '0.75rem',
        height: '320px',
        overflowY: 'auto',
        fontSize: '0.75rem',
        lineHeight: 1.7,
        fontFamily: 'var(--font-mono)',
      }}>
        {logs.length === 0 && (
          <div style={{ color: '#87867f', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>hourglass_empty</span>
            Waiting for scan events…
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{
            color: levelColor[log.level] ?? '#b0aea5',
            padding: '1px 0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            <span style={{ color: '#555', userSelect: 'none', marginRight: '0.5rem' }}>
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
