export type CpuLimit = { quota: number | 'max'; period: number } | null;

export type SystemMetrics = {
  status: 'ok' | 'degraded';
  reason?: string;
  timestamp: string;
  host: string;
  platform: NodeJS.Platform;
  uptimeSec: number;
  cpu: {
    percent: number;
    coresHost: number;
    coresEffective: number;
    loadPct: { '1m': number; '5m': number; '15m': number };
    rawLoad: { '1m': number; '5m': number; '15m': number };
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    usedPct: number;
    source: 'cgroup' | 'os' | 'degraded';
  };
};
