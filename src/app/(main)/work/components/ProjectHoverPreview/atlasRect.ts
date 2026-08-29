import * as THREE from 'three';

import { isVisibleStaticProject, projects } from '../../constants';
import { previewAtlas } from './atlas';

const atlasSlugs = projects
  .filter(isVisibleStaticProject)
  .flatMap((project) => (project.slug ? [project.slug] : []));

export const atlasRows = Math.ceil(atlasSlugs.length / previewAtlas.columns);

const atlasIndexBySlug = new Map(atlasSlugs.map((slug, index) => [slug, index]));

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
