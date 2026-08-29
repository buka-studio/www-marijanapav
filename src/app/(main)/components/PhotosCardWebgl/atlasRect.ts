import * as THREE from 'three';

import { photos } from '../photos';
import { photosAtlas } from './atlas';

export const photosAtlasRows = Math.ceil(photos.length / photosAtlas.columns);

const insetU = 1 / (photosAtlas.columns * photosAtlas.cellWidth);
const insetV = 1 / (photosAtlasRows * photosAtlas.cellHeight);

export function setPhotoAtlasRect(target: THREE.Vector4, atlasIndex: number) {
  const col = atlasIndex % photosAtlas.columns;
  const row = Math.floor(atlasIndex / photosAtlas.columns);

  target.set(
    1 / photosAtlas.columns - 2 * insetU,
    1 / photosAtlasRows - 2 * insetV,
    col / photosAtlas.columns + insetU,
    1 - (row + 1) / photosAtlasRows + insetV,
  );
}
