import * as THREE from 'three';

import { previewAtlas } from './atlas';

export const atlasRows = Math.ceil(previewAtlas.cells.length / previewAtlas.columns);

const atlasIndexBySlug = new Map<string, number>(
  previewAtlas.cells.map((cell, index) => [cell.slug, index]),
);

const insetU = 1 / (previewAtlas.columns * previewAtlas.cellWidth);
const insetV = 1 / (atlasRows * previewAtlas.cellHeight);

export function setAtlasRect(target: THREE.Vector4, atlasIndex: number) {
  const col = atlasIndex % previewAtlas.columns;
  const row = Math.floor(atlasIndex / previewAtlas.columns);

  target.set(
    1 / previewAtlas.columns - 2 * insetU,
    1 / atlasRows - 2 * insetV,
    col / previewAtlas.columns + insetU,
    1 - (row + 1) / atlasRows + insetV,
  );
}

export function bindAtlasRect(target: THREE.Vector4, slug: string | undefined) {
  if (!slug) {
    return 0;
  }

  const atlasIndex = atlasIndexBySlug.get(slug);
  if (atlasIndex === undefined) {
    return 0;
  }

  setAtlasRect(target, atlasIndex);
  return 1;
}
