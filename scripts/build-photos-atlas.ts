import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { photosAtlas } from '../src/app/(main)/components/PhotosCardWebgl/atlas';

const ROOT = path.resolve(import.meta.dirname, '..');
const ATLAS_IMAGE_PATH = path.join(ROOT, 'public', photosAtlas.src.replace(/^\//, ''));
const WEBP_QUALITY = 80;

async function main() {
  const { cellWidth, cellHeight, columns, cells } = photosAtlas;
  const rows = Math.ceil(cells.length / columns);

  const composites = await Promise.all(
    cells.map(async (file, index) => ({
      input: await sharp(path.join(ROOT, 'public', file))
        .rotate()
        .resize(cellWidth, cellHeight, { fit: 'cover', position: 'center' })
        .toBuffer(),
      left: (index % columns) * cellWidth,
      top: Math.floor(index / columns) * cellHeight,
    })),
  );

  await mkdir(path.dirname(ATLAS_IMAGE_PATH), { recursive: true });
  await sharp({
    create: {
      width: columns * cellWidth,
      height: rows * cellHeight,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(composites)
    .webp({ quality: WEBP_QUALITY, effort: 6 })
    .toFile(ATLAS_IMAGE_PATH);

  console.log(`Wrote ${cells.length} cells into a ${columns}×${rows} atlas: ${ATLAS_IMAGE_PATH}`);
  for (const [index, file] of cells.entries()) {
    console.log(`  ${String(index).padStart(2, '0')}  ${file}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
