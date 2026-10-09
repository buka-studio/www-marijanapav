import { stampAtlases, type StampAtlas } from './atlas';
import { CollectionType } from './constants';
import { Stamp, stampDefaultDimensions } from './models';

export { stampDefaultDimensions };

export function getStampSpriteSize(stamp: Stamp, atlas: StampAtlas | undefined, sizeScale = 1) {
  const item = atlas?.items[stamp.id];
  if (atlas && item) {
    const { scale } = atlas.metadata;
    return {
      width: (item.w / scale) * sizeScale,
      height: (item.h / scale) * sizeScale,
    };
  }

  return {
    width: (stamp.width || stampDefaultDimensions.width) * sizeScale,
    height: (stamp.height || stampDefaultDimensions.height) * sizeScale,
  };
}

export function getStampAtlas(collection: CollectionType): StampAtlas | undefined {
  return stampAtlases[collection as keyof typeof stampAtlases];
}

const atlasDecodeCache = new Map<string, Promise<void>>();

export function ensureStampAtlas(collection: CollectionType) {
  const atlas = getStampAtlas(collection);
  if (!atlas || typeof window === 'undefined') {
    return Promise.resolve();
  }

  const { src } = atlas.metadata;
  const cached = atlasDecodeCache.get(src);
  if (cached) {
    return cached;
  }

  const pending = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    const fail = () => {
      atlasDecodeCache.delete(src);
      reject(new Error(`Failed to load atlas ${src}`));
    };
    const decode = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(resolve, fail);
      } else {
        resolve();
      }
    };
    img.onload = decode;
    img.onerror = fail;
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      decode();
    } else if (img.complete) {
      fail();
    }
  });

  atlasDecodeCache.set(src, pending);
  pending.catch(() => {
    atlasDecodeCache.delete(src);
  });
  return pending;
}

export function preloadStampAtlases(
  collections: CollectionType[] = Object.keys(stampAtlases) as CollectionType[],
) {
  for (const collection of collections) {
    void ensureStampAtlas(collection).catch(() => {});
  }
}
