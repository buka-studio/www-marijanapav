import createDOMPurify from 'dompurify';
import { parseHTML } from 'linkedom';
import { NextResponse } from 'next/server';

import { getCloudflareEnv } from '~/src/cloudflare/env';

const MAX_SIZE = 500 * 1024; // 500KB

const { window } = parseHTML('');
const purify = createDOMPurify(window);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const svgFile = formData.get('svg') as File;

    if (!svgFile) {
      return NextResponse.json({ message: 'SVG file is required.' }, { status: 400 });
    }

    if (svgFile.size > MAX_SIZE) {
      return NextResponse.json({ message: 'SVG file is too large.' }, { status: 413 });
    }

    const cleanSvgString = purify.sanitize(await svgFile.text());
    const key = `uploads/sketch_${Date.now()}_${crypto.randomUUID()}.svg`;

    await getCloudflareEnv().SKETCHES.put(key, cleanSvgString, {
      httpMetadata: {
        contentType: 'image/svg+xml',
      },
    });

    return NextResponse.json(
      {
        message: 'Sketch uploaded successfully.',
      },
      {
        status: 200,
      },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Something went wrong.' }, { status: 500 });
  }
}
