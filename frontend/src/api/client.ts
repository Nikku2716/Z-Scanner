export type ScanMode = 'quick' | 'fast' | 'deep' | 'stealth';

export type ScanStatus = 'pending' | 'running' | 'complete' | 'failed' | 'stopped';

export interface Alert {
  id: string;
  pluginId: string;
  name: string;
  risk: string;
  confidence: string;
  url: string;
  method: string;
  param: string;
  attack?: string;
  evidence?: string;
  description: string;
  solution: string;
  reference: string;
  cweid: string;
}

export interface Progress {
  phase: string;
  spiderPercent: number;
  activePercent: number;
  passiveQueue: number;
  message: string;
}

export interface Scan {
  id: string;
  target: string;
  config: { mode: ScanMode; maxChildren: number };
  status: ScanStatus;
  progress: Progress;
  alerts: Alert[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

const BASE = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Request failed');
  }
  return res.json();
}

export const api = {
  listScans: () => request<Scan[]>('/api/scans'),
  startScan: (target: string, mode: ScanMode) =>
    request<Scan>('/api/scan', {
      method: 'POST',
      body: JSON.stringify({ target, mode }),
    }),
  getStatus: (id: string) => request<Scan>(`/api/status/${id}`),
  stopScan: (id: string) =>
    request<{ status: string }>(`/api/stop/${id}`, { method: 'POST' }),
  deleteScan: (id: string) =>
    request<{ status: string }>(`/api/scan/${id}`, { method: 'DELETE' }),
  getReport: (id: string) => request<Scan>(`/api/report/${id}`),
  reportHTMLUrl: (id: string) => `${BASE}/api/report/${id}/html`,
  wsUrl: (id: string) => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = BASE ? new URL(BASE).host : window.location.host;
    return `${proto}//${host}/api/ws/${id}`;
  },
};
