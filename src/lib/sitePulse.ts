export interface SitePulse {
  status: 'ok' | 'degraded';
  reason?: string;
  runtime: 'cloudflare-workers';
  timestamp: string;
  edge: {
    colo?: string;
    country?: string | null;
    city?: string | null;
    region?: string | null;
    timezone?: string;
    httpProtocol?: string;
    tlsVersion?: string;
    tlsCipher?: string;
    rttMs?: number;
    asOrganization?: string;
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
}

type SitePulseOverrides = Omit<Partial<SitePulse>, 'edge' | 'timings' | 'counters'> & {
  edge?: Partial<SitePulse['edge']>;
  timings?: Partial<SitePulse['timings']>;
  counters?: Partial<SitePulse['counters']>;
};

export function createDefaultSitePulse(overrides: SitePulseOverrides = {}): SitePulse {
  const base: SitePulse = {
    status: 'degraded',
    reason: 'Waiting for an edge request.',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
    edge: {},
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
