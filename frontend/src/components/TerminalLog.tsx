import { useEffect, useRef } from 'react';
import type { LogEntry } from '../api/client';

interface Props {
  logs: LogEntry[];
}

const levelColor: Record<string, string> = {
  info: 'var(--on-surface-variant)',
  success: 'var(--primary-dim)',
  warn: 'var(--tertiary)',
  error: 'var(--error)',
};

export default function TerminalLog({ logs }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      style={{
        background: 'var(--surface-container-lowest)',
        border: '1px solid var(--outline-variant)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Terminal header with window dots */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.625rem 0.875rem',
        background: 'var(--surface-container-low)',
        borderBottom: '1px solid var(--outline-variant)',
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
        <span style={{
          marginLeft: '0.5rem',
          fontFamily: 'var(--font-label)',
          fontSize: '0.625rem',
          color: 'var(--outline)',
          letterSpacing: '0.05em',
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
          <div style={{ color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>hourglass_empty</span>
            Waiting for scan events…
          </div>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{
            color: levelColor[log.level] ?? 'var(--on-surface-variant)',
            padding: '1px 0',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            <span style={{ color: 'var(--outline)', opacity: 0.5, userSelect: 'none', marginRight: '0.5rem' }}>
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
