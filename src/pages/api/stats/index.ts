import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pathname = req.query?.pathname as string;
    const type = (req.query?.type as string)?.toLowerCase() || 'view';

    if (!pathname) {
      return res.status(400).json({ message: 'Pathname is required.' });
    }

    const supabase = createClient(process.env.DB_URL!, process.env.DB_TOKEN!, {
      global: {
        // todo: remove this once undici stops appending stuff to the content-type header
        fetch: fetch.bind(globalThis) as any,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('stats')
        .select('count')
        .match({ pathname, type });

      if (error) {
        throw error;
      }

      const count = !data?.length ? 0 : Number(data[0]?.count);
      return res.status(200).json({ count });
    }

    if (req.method === 'POST') {
      let amount = 1;
      try {
        const parsed = JSON.parse(req.body);
        if (Number.isFinite(parsed.amount)) {
          amount = parsed.amount;
        }
      } catch (e) {
        // pass
      }

      const { data, error } = await supabase.rpc('incr_stat', {
        pathname,
        type,
        amount,
      });

      if (error) {
        throw error;
      }

      return res.status(200).json({ count: data });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: (e as any).message || 'Something went wrong' });
  }
}
