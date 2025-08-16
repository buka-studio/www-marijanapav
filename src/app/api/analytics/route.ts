import { NextResponse } from 'next/server';

import { fetchWebsiteStats } from '~/src/umami/server';

interface AnalyticsResponse {
  active: boolean;
  count: number;
}

export async function GET(req: Request) {
  try {
    const { data: stats, error } = await fetchWebsiteStats();

    if (error) {
      throw error;
    }

    return NextResponse.json({ stats });
  } catch (e) {
    console.error(e);
    NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
  }
}
