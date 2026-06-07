import { NextResponse } from 'next/server';

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { and, count, eq } from 'drizzle-orm';

import { getDb } from '~/src/db/client';
import { feedback, stats } from '~/src/db/schema';
import { createDefaultSitePulse } from '~/src/lib/sitePulse';

type CloudflareRequestMetadata = {
  colo?: string;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  timezone?: string;
  httpProtocol?: string;
  tlsVersion?: string;
  tlsCipher?: string;
  clientTcpRtt?: number;
  clientQuicRtt?: number;
  asOrganization?: string;
};

type D1Counters = {
  homeViews: number;
  sneakPeekActions: number;
  feedbackMessages: number;
};

type TimedResult<T> =
  | {
      status: 'fulfilled';
      value: T;
      ms: number;
    }
  | {
      status: 'rejected';
      reason: unknown;
      ms: number;
    };

const roundMs = (value: number) => Math.max(0, Math.round(value));

async function timed<T>(read: () => Promise<T>): Promise<TimedResult<T>> {
  const start = performance.now();

  try {
    const value = await read();

    return {
      status: 'fulfilled',
      value,
      ms: roundMs(performance.now() - start),
    };
  } catch (reason) {
    return {
      status: 'rejected',
      reason,
      ms: roundMs(performance.now() - start),
    };
  }
}

async function readD1Counters(env: Env): Promise<D1Counters> {
  const db = getDb(env);

  const homeViewsPromise = db
    .select({ count: stats.count })
    .from(stats)
    .where(and(eq(stats.pathname, '/'), eq(stats.type, 'view')))
    .limit(1);

  const sneakPeekActionsPromise = db
    .select({ count: stats.count })
    .from(stats)
    .where(and(eq(stats.pathname, '/#sneak-peek'), eq(stats.type, 'action')))
    .limit(1);

  const feedbackMessagesPromise = db.select({ count: count() }).from(feedback);

  const [[homeViews], [sneakPeekActions], [feedbackMessages]] = await Promise.all([
    homeViewsPromise,
    sneakPeekActionsPromise,
    feedbackMessagesPromise,
  ]);

  return {
    homeViews: Number(homeViews?.count ?? 0),
    sneakPeekActions: Number(sneakPeekActions?.count ?? 0),
    feedbackMessages: Number(feedbackMessages?.count ?? 0),
  };
}

async function countSketches(env: Env) {
  let count = 0;
  let cursor: string | undefined;

  do {
    const page = await env.SKETCHES.list({
      prefix: 'uploads/',
      limit: 1000,
      cursor,
    });

    count += page.objects.length;
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);

  return count;
}

function getFailureReason(results: Array<TimedResult<unknown>>) {
  const failed = results.find((result) => result.status === 'rejected');

  if (!failed) {
    return undefined;
  }

  return failed.reason instanceof Error ? failed.reason.message : 'Pulse source unavailable.';
}

export async function GET() {
  const pulseStart = performance.now();

  try {
    const { env, cf: requestCf } = getCloudflareContext();
    const cf = (requestCf ?? {}) as CloudflareRequestMetadata;
    const rttMs = cf.clientQuicRtt ?? cf.clientTcpRtt;

    const [d1Result, r2Result] = await Promise.all([
      timed(() => readD1Counters(env as Env)),
      timed(() => countSketches(env as Env)),
    ]);

    const d1 = d1Result.status === 'fulfilled' ? d1Result : undefined;
    const r2 = r2Result.status === 'fulfilled' ? r2Result : undefined;
    const failedReason = getFailureReason([d1Result, r2Result]);

    return NextResponse.json(
      createDefaultSitePulse({
        status: failedReason ? 'degraded' : 'ok',
        reason: failedReason,
        edge: {
          colo: cf.colo,
          country: cf.country,
          city: cf.city,
          region: cf.region,
          timezone: cf.timezone,
          httpProtocol: cf.httpProtocol,
          tlsVersion: cf.tlsVersion,
          tlsCipher: cf.tlsCipher,
          rttMs,
          asOrganization: cf.asOrganization,
        },
        timings: {
          pulseMs: roundMs(performance.now() - pulseStart),
          d1Ms: d1Result.ms,
          r2Ms: r2Result.ms,
        },
        counters: {
          homeViews: d1?.value.homeViews ?? 0,
          sneakPeekActions: d1?.value.sneakPeekActions ?? 0,
          feedbackMessages: d1?.value.feedbackMessages ?? 0,
          sketchesUploaded: r2?.value ?? 0,
        },
      }),
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (e) {
    console.error(e);

    return NextResponse.json(
      createDefaultSitePulse({
        reason: e instanceof Error ? e.message : 'Site pulse unavailable.',
        timings: {
          pulseMs: roundMs(performance.now() - pulseStart),
        },
      }),
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}
