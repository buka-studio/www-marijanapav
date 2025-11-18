import { randomUUID } from 'crypto';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '~/src/supabase/server';

const schema = z.object({
  message: z.string().trim().min(1).max(1000),
  hp: z.string().optional(),
});

const COOKIE = 'feedback_id';
const WINDOW_MS = 30_000;
const MAX_AGE_MS = 60 * 60 * 24 * 365; // 1 year

export async function POST(req: Request) {
  try {
    const hdrs = await headers();
    const ua = hdrs.get('user-agent');

    const cookieStore = await cookies();
    let feedbackId = cookieStore.get(COOKIE)?.value;
    if (!feedbackId) {
      feedbackId = randomUUID();
    }

    const body = await req.formData().catch(() => new FormData());

    const data = Object.fromEntries(body);
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid payload.' }, { status: 400 });
    }

    if (parsed.data.hp && parsed.data.hp.length > 0) {
      return NextResponse.json({}, { status: 204 });
    }

    const supabase = await createClient();

    const sinceISO = new Date(Date.now() - WINDOW_MS).toISOString();
    const { count: recentCount, error: countErr } = await supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sinceISO)
      .eq('feedback_id', feedbackId);

    if (countErr) {
      throw countErr;
    }
    if ((recentCount ?? 0) > 0) {
      return NextResponse.json({ message: 'Too many requests.' }, { status: 429 });
    }

    const { error } = await supabase.from('feedback').insert({
      feedback_id: feedbackId,
      message: parsed.data.message,
      ua,
      meta: {},
    });

    if (error) {
      throw error;
    }

    const res = NextResponse.json({ ok: true }, { status: 201 });
    if (!cookieStore.get(COOKIE)?.value) {
      res.cookies.set(COOKIE, feedbackId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: MAX_AGE_MS,
      });
    }
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
