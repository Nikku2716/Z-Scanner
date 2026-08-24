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

export interface Endpoint {
  id: string;
  scanId: string;
  url: string;
  path: string;
  method: string;
  statusCode?: number;
  contentType?: string;
  params?: string[];
  riskCounts?: Record<string, number>;
  discoveredAt: string;
}

export interface AttackSurface {
  scanId: string;
  target: string;
  total: number;
  endpoints: Endpoint[];
  methodCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  riskTotals: Record<string, number>;
}

export interface Finding {
  id: string;
  scanId: string;
  pluginId: string;
  name: string;
  risk: string;
  confidence: string;
  description: string;
  solution: string;
  reference: string;
  cweid: string;
  wascid?: string;
  param?: string;
  affectedUrls: string[];
  affectedCount: number;
  alerts: Alert[];
}

export interface CategoryStat {
  name: string;
  pluginId: string;
  cweId?: string;
  risk: string;
  count: number;
}

export interface ScoreResult {
  score: number;
  riskCounts: Record<string, number>;
  findingCount: number;
  alertCount: number;
  affectedEndpoints: number;
  categories: CategoryStat[];
  methodology: string;
}

export interface EndpointHit {
  url: string;
  path: string;
  findingCount: number;
  risks: Record<string, number>;
}

export interface Analytics {
  scanId: string;
  score: ScoreResult;
  findings: Finding[];
  mostAffected: EndpointHit[];
  methodCounts: Record<string, number>;
  statusCodes?: Record<string, number>;
  totalEndpoints: number;
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
  getSurface: (id: string, params?: { method?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.method) qs.set('method', params.method);
    if (params?.search) qs.set('search', params.search);
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<AttackSurface>(`/api/scan/${id}/surface${suffix}`);
  },
  getEndpoints: (id: string) => request<Endpoint[]>(`/api/scan/${id}/endpoints`),
  getAnalytics: (id: string) => request<Analytics>(`/api/scan/${id}/analytics`),
  getFindings: (id: string, risk?: string) =>
    request<Finding[]>(`/api/scan/${id}/findings${risk ? `?risk=${encodeURIComponent(risk)}` : ''}`),
  getFinding: (id: string, findingId: string) =>
    request<Finding>(`/api/scan/${id}/findings/${findingId}`),
  wsUrl: (id: string) => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = BASE ? new URL(BASE).host : window.location.host;
    return `${proto}//${host}/api/ws/${id}`;
  },
};
