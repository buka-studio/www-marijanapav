import dompurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { NextResponse } from 'next/server';

import { createClient } from '~/src/supabase/server';

const MAX_SIZE = 500 * 1024; // 500KB

const window = new JSDOM('').window;
const purify = dompurify(window);

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

    const svgBlob = new Blob([svgFile], { type: 'image/svg+xml' });

    const svgString = await svgBlob.text();
    const cleanSvgString = purify.sanitize(svgString);
    const cleanSvgBlob = new Blob([cleanSvgString], { type: 'image/svg+xml' });

    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from('sketches')
      .upload(`uploads/sketch_${Date.now()}.svg`, cleanSvgBlob, {
        contentType: 'image/svg+xml',
        upsert: false,
      });

    if (error) {
      throw error;
    }

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
