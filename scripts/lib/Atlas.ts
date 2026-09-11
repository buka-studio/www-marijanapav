import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

export const ROOT = path.resolve(import.meta.dirname, '../..');

export type AtlasFrame = { x: number; y: number; w: number; h: number };

export type AtlasSprite = {
  id: string;
  input: Buffer;
  width: number;
  height: number;
};

export type AtlasLayout = {
  width: number;
  height: number;
  frames: Record<string, AtlasFrame>;
};

export type AtlasOptions = {
  outFile: string;
  quality?: number;
  alpha?: boolean;
  effort?: number;
};

export function evenSize(value: number) {
  return Math.max(2, Math.ceil(value / 2) * 2);
}

function packShelf(
  sprites: Pick<AtlasSprite, 'id' | 'width' | 'height'>[],
  { gutter, maxWidth }: { gutter: number; maxWidth: number },
): AtlasLayout {
  const sorted = [...sprites].sort((a, b) => b.height - a.height || b.width - a.width);
  let x = gutter;
  let y = gutter;
  let rowHeight = 0;
  let atlasWidth = gutter;
  let atlasHeight = gutter;
  const frames: Record<string, AtlasFrame> = {};

  for (const sprite of sorted) {
    if (x > gutter && x + sprite.width + gutter > maxWidth) {
      x = gutter;
      y += rowHeight + gutter;
      rowHeight = 0;
    }

    frames[sprite.id] = { x, y, w: sprite.width, h: sprite.height };
    x += sprite.width + gutter;
    rowHeight = Math.max(rowHeight, sprite.height);
    atlasWidth = Math.max(atlasWidth, x);
    atlasHeight = y + rowHeight + gutter;
  }

  return {
    frames,
    width: evenSize(atlasWidth),
    height: evenSize(atlasHeight),
  };
}

function packGrid(
  sprites: Pick<AtlasSprite, 'id'>[],
  { cellWidth, cellHeight, columns }: { cellWidth: number; cellHeight: number; columns: number },
): AtlasLayout {
  const rows = Math.max(1, Math.ceil(sprites.length / columns));
  const frames: Record<string, AtlasFrame> = {};

  for (const [index, sprite] of sprites.entries()) {
    frames[sprite.id] = {
      x: (index % columns) * cellWidth,
      y: Math.floor(index / columns) * cellHeight,
      w: cellWidth,
      h: cellHeight,
    };
  }

  return {
    frames,
    width: columns * cellWidth,
    height: rows * cellHeight,
  };
}

/** Variable-size shelf pack (stamps) or fixed grid (photos / work previews). */
export default class Atlas {
  readonly #sprites: AtlasSprite[] = [];
  readonly #outFile: string;
  readonly #quality: number;
  readonly #alpha: boolean;
  readonly #effort: number;
  #layout: AtlasLayout | null = null;

  constructor({ outFile, quality = 80, alpha = false, effort = 6 }: AtlasOptions) {
    this.#outFile = outFile;
    this.#quality = quality;
    this.#alpha = alpha;
    this.#effort = effort;
  }

  add(sprite: AtlasSprite) {
    this.#sprites.push(sprite);
    this.#layout = null;
    return this;
  }

  packShelf(options: { gutter: number; maxWidth: number }) {
    this.#layout = packShelf(this.#sprites, options);
    return this.#layout;
  }

  packGrid(options: { cellWidth: number; cellHeight: number; columns: number }) {
    this.#layout = packGrid(this.#sprites, options);
    return this.#layout;
  }

  async write() {
    const layout = this.#layout;
    if (!layout) {
      throw new Error('Pack the atlas with packShelf() or packGrid() before write().');
    }

    await mkdir(path.dirname(this.#outFile), { recursive: true });

    await sharp({
      create: {
        width: layout.width,
        height: layout.height,
        channels: this.#alpha ? 4 : 3,
        background: this.#alpha ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 0, g: 0, b: 0 },
      },
    })
      .composite(
        this.#sprites.map((sprite) => {
          const frame = layout.frames[sprite.id];
          if (!frame) {
            throw new Error(`No packed frame for "${sprite.id}".`);
          }
          return {
            input: sprite.input,
            left: frame.x,
            top: frame.y,
          };
        }),
      )
      .webp({
        quality: this.#quality,
        effort: this.#effort,
        ...(this.#alpha ? { alphaQuality: 100, smartSubsample: true } : {}),
      })
      .toFile(this.#outFile);

    return {
      ...layout,
      outFile: this.#outFile,
      metadata: await sharp(this.#outFile).metadata(),
    };
  }
}
