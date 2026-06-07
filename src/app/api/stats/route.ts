import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { eq, and, sql } from 'drizzle-orm';

import { getDb } from '~/src/db/client';
import { stats } from '~/src/db/schema';

type IncrementBody = {
  amount?: unknown;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  try {
    const pathname = searchParams.get('pathname');
    const type = searchParams.get('type')?.toLowerCase() || 'view';

    if (!pathname) {
      return NextResponse.json({ message: 'Pathname is required.' }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .select({ count: stats.count })
      .from(stats)
      .where(and(eq(stats.pathname, pathname), eq(stats.type, type)))
      .limit(1);

    return NextResponse.json({ count: Number(row?.count ?? 0) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get('notrack')) {
    return NextResponse.json({ message: 'Not tracking.', count: 0 }, { status: 200 });
  }

  const { searchParams } = new URL(req.url);

  try {
    const pathname = searchParams.get('pathname');
    const type = searchParams.get('type')?.toLowerCase() || 'view';

    if (!pathname) {
      return NextResponse.json({ message: 'Pathname is required.' }, { status: 400 });
    }

    let amount = 1;
    try {
      const body = (await req.json()) as IncrementBody;

      if (Number.isFinite(body.amount)) {
        amount = Number(body.amount);
      }
    } catch (e) {
      // pass
    }

    const db = getDb();

    await db
      .insert(stats)
      .values({ pathname, type, count: amount })
      .onConflictDoUpdate({
        target: [stats.pathname, stats.type],
        set: {
          count: sql`${stats.count} + excluded.count`,
        },
      });

    const [row] = await db
      .select({ count: stats.count })
      .from(stats)
      .where(and(eq(stats.pathname, pathname), eq(stats.type, type)))
      .limit(1);

    return NextResponse.json({ count: Number(row?.count ?? 0) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
  }
}
