// Must match the order of `photos` in ../photos.ts. Rebuild with `pnpm atlas:photos` after editing.
// Paths are relative to /public.
export const photosAtlas = {
  src: '/home/photos-atlas.webp',
  cellWidth: 960,
  cellHeight: 960,
  columns: 4,
  cells: [
    'home/photos/photo_0.jpg',
    'home/photos/photo_1.jpg',
    'home/photos/photo_2.jpg',
    'home/photos/kava-coffee-bags-caffeine-crack-sticker.png',
    'home/photos/photo_3.jpg',
    'home/photos/photo_4.jpg',
    'home/photos/photo_5.jpg',
    'home/photos/photo_6.jpg',
    'home/photos/photo_7.jpg',
    'home/photos/photo_8.jpg',
    'home/photos/photo_9.jpg',
    'home/photos/photo_10.jpg',
  ],
} as const;
