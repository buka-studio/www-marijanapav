import { SitePulse } from './sitePulse';

export type SystemMetrics = {
  status: 'ok' | 'degraded';
  reason?: string;
  timestamp: string;
  runtime: 'cloudflare-workers';
  edge: {
    colo: string;
    location: string;
    network: string;
    protocol: string;
    tls: string;
    rttMs: number | null;
  };
  timings: {
    pulseMs: number | null;
    d1Ms: number | null;
    r2Ms: number | null;
  };
  counters: {
    homeViews: number;
    sneakPeekActions: number;
    feedbackMessages: number;
    sketchesUploaded: number;
  };
};

export function createDefaultSystemMetrics(overrides: Partial<SystemMetrics> = {}): SystemMetrics {
  const base: SystemMetrics = {
    status: 'degraded',
    reason: 'Waiting for an edge request.',
    timestamp: new Date().toISOString(),
    runtime: 'cloudflare-workers',
    edge: {
      colo: 'local',
      location: 'Local preview',
      network: 'unknown',
      protocol: 'pending',
      tls: 'pending',
      rttMs: null,
    },
    timings: {
      pulseMs: null,
      d1Ms: null,
      r2Ms: null,
    },
    counters: {
      homeViews: 0,
      sneakPeekActions: 0,
      feedbackMessages: 0,
      sketchesUploaded: 0,
    },
  };

  return {
    ...base,
    ...overrides,
    edge: {
      ...base.edge,
      ...overrides.edge,
    },
    timings: {
      ...base.timings,
      ...overrides.timings,
    },
    counters: {
      ...base.counters,
      ...overrides.counters,
    },
  };
}

export function systemMetricsFromSitePulse(pulse: SitePulse): SystemMetrics {
  const location = [pulse.edge.city, pulse.edge.region, pulse.edge.country].filter(Boolean);

  return createDefaultSystemMetrics({
    status: pulse.status,
    reason: pulse.reason,
    timestamp: pulse.timestamp,
    edge: {
      colo: pulse.edge.colo ?? 'local',
      location: location.length > 0 ? location.join(', ') : 'Local preview',
      network: pulse.edge.asOrganization ?? 'unknown',
      protocol: pulse.edge.httpProtocol ?? 'pending',
      tls: pulse.edge.tlsVersion ?? 'pending',
      rttMs: Number.isFinite(pulse.edge.rttMs) ? pulse.edge.rttMs! : null,
    },
    timings: pulse.timings,
    counters: pulse.counters,
  });
}
