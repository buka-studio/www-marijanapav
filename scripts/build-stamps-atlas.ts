import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { collections } from '../src/app/stamps/constants';
import { stampDefaultDimensions } from '../src/app/stamps/models';
import Atlas, { ROOT } from './lib/Atlas';

const ATLAS_DIR = path.join(ROOT, 'public/stamps/atlases');
const MANIFEST_DIR = path.join(ROOT, 'src/app/stamps/atlases');

const SCALE = 3;
const GUTTER = 6;
const MAX_WIDTH = 2048;
const WEBP_QUALITY = 90;

async function getStampCssSize(stamp: { src: string; width?: number; height?: number }) {
  const file = path.join(ROOT, 'public', stamp.src.replace(/^\//, ''));
  const meta = await sharp(file, { density: 72 }).metadata();
  const intrinsicWidth = meta.width || stampDefaultDimensions.width;
  const intrinsicHeight = meta.height || stampDefaultDimensions.height;
  const width = stamp.width || stampDefaultDimensions.width;

  return {
    width,
    height: Math.max(1, Math.round(width * (intrinsicHeight / intrinsicWidth))),
  };
}

async function rasterizeStamp(src: string, cssWidth: number, cssHeight: number) {
  const file = path.join(ROOT, 'public', src.replace(/^\//, ''));

  return sharp(file, { density: 72 * SCALE })
    .rotate()
    .resize(cssWidth * SCALE, cssHeight * SCALE, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png()
    .toBuffer();
}

async function writeCollectionAtlas(
  collectionKey: string,
  stamps: Array<{ id: string; width: number; height: number; buffer: Buffer }>,
) {
  const src = `/stamps/atlases/${collectionKey}.webp`;
  const atlas = new Atlas({
    outFile: path.join(ROOT, 'public', src.replace(/^\//, '')),
    quality: WEBP_QUALITY,
    alpha: true,
  });

  for (const stamp of stamps) {
    atlas.add({
      id: stamp.id,
      input: stamp.buffer,
      width: stamp.width,
      height: stamp.height,
    });
  }

  const packed = atlas.packShelf({ gutter: GUTTER, maxWidth: MAX_WIDTH });
  const { metadata } = await atlas.write();

  console.log(
    `${collectionKey}: ${stamps.length} stamps → ${packed.width}×${packed.height} ${src} (${Math.round((metadata.size ?? 0) / 1024)}kb)`,
  );

  const manifest = {
    metadata: {
      src,
      width: packed.width,
      height: packed.height,
      scale: SCALE,
    },
    items: packed.frames,
  };

  await mkdir(MANIFEST_DIR, { recursive: true });
  const manifestPath = path.join(MANIFEST_DIR, `${collectionKey}.json`);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${manifestPath}`);

  return manifest;
}

async function main() {
  await mkdir(ATLAS_DIR, { recursive: true });

  await Promise.all(
    Object.entries(collections).map(async ([collectionKey, collection]) => {
      if (collection.stamps.length === 0) {
        return;
      }

      const packedStamps = await Promise.all(
        collection.stamps.map(async (stamp) => {
          const { width, height } = await getStampCssSize(stamp);
          const buffer = await rasterizeStamp(stamp.src, width, height);

          return {
            id: stamp.id,
            width: width * SCALE,
            height: height * SCALE,
            buffer,
          };
        }),
      );

      await writeCollectionAtlas(collectionKey, packedStamps);
    }),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
