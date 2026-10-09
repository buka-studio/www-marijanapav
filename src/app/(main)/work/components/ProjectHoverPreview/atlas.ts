// Cell order is the atlas layout. Rebuild with `pnpm atlas:work-preview` after editing.
// Paths are relative to /public.
export const previewAtlas = {
  src: '/work/preview-atlas.webp',
  cellWidth: 600,
  cellHeight: 450,
  columns: 5,
  cells: [
    { slug: 'vercel-startups', file: 'work/vercel-startups/vercel-startups-hero.png' },
    { slug: 'geist-impact', file: 'work/geist-impact/preview.png' },
    { slug: 'feedback-postcards', file: 'work/postcard/feedback-postcard_00.png' },
    { slug: 'the-weight-of-paper', file: 'work/the-weight-of-paper/weight-of-paper-loupe.png' },
    { slug: 'how-livekit-works', file: 'work/livekit/livekit_preview.png' },
    { slug: 'echo-tab-landing', file: 'work/echo-tab-landing-page/preview.png' },
    { slug: 'supabase-branding', file: 'work/supabase-homepage/supabase-homepage-hero.png' },
    { slug: 'supabase-launch-week-12', file: 'work/supabase-lw12/preview.png' },
    { slug: 'supabase-launch-week-8', file: 'work/stamps/stars.gif' },
    { slug: 'supabase-lw7', file: 'work/supabase-lw7/preview.png' },
    { slug: 'infinum-beer', file: 'work/infinum-beer/preview.png' },
    { slug: 'infinum-swag', file: 'work/infinum-merch/infinum_merch_00.jpg' },
  ],
} as const;
