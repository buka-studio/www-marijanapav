import colors from 'tailwindcss/colors';

import type { StampAtlas } from '../../../atlas';
import { getStampSpriteSize } from '../../../atlas-utils';
import { Stamp } from '../../../models';
import LoupeSourceCanvas from './LoupeSourceCanvas';
import type { WorkerRequest, WorkerResponse } from './source.worker';

export type LoupeSourceRequest = {
  stampId: string;
  src: string;
  fallbackSrc?: string;
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  stampWidth: number;
  stampHeight: number;
  gridCellSize: number;
  background: string;
  foreground: string;
};

const MAX_CACHE = 4;
const MAX_BITMAPS = 6;
const MAX_SOURCE_DIM = 4096;

export default class LoupeSource {
  readonly bitmap: ImageBitmap;
  readonly cssWidth: number;
  readonly cssHeight: number;

  static readonly #bitmaps = new Map<string, Promise<ImageBitmap>>();
  static readonly #bitmapsOrder: string[] = [];
  static readonly #rendered = new Map<string, Promise<LoupeSource>>();
  static readonly #renderedOrder: string[] = [];
  static readonly #pending = new Map<
    number,
    { resolve: (value: LoupeSource) => void; reject: (error: Error) => void }
  >();
  static #worker: Worker | null | undefined;
  static #requestId = 0;

  constructor(bitmap: ImageBitmap, cssWidth: number, cssHeight: number) {
    this.bitmap = bitmap;
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
  }

  static request({
    stamp,
    atlas,
    sizeScale,
    centerScale,
    cssWidth,
    cssHeight,
    gridCellSize,
    isMobile,
  }: {
    stamp: Stamp;
    atlas?: StampAtlas;
    sizeScale: number;
    centerScale: number;
    cssWidth: number;
    cssHeight: number;
    gridCellSize: number;
    isMobile: boolean;
  }): LoupeSourceRequest {
    const size = getStampSpriteSize(stamp, atlas, sizeScale * centerScale);
    return {
      stampId: stamp.id,
      src: stamp.srcLg,
      fallbackSrc: stamp.src,
      cssWidth,
      cssHeight,
      dpr: LoupeSource.#capDpr(cssWidth, cssHeight, LoupeSource.#dpr()),
      stampWidth: size.width,
      stampHeight: size.height,
      gridCellSize,
      background: colors.stone[100],
      foreground: isMobile ? colors.stone[200] : colors.stone[300],
    };
  }

  static prefetch(src: string, fallbackSrc?: string) {
    return LoupeSource.#loadBitmap(src, fallbackSrc);
  }

  static prepare(req: LoupeSourceRequest) {
    if (req.cssWidth < 2 || req.cssHeight < 2 || req.stampWidth < 1 || req.stampHeight < 1) {
      return Promise.reject(new Error('Invalid loupe source size'));
    }

    const key = LoupeSource.#cacheKey(req);
    const cached = LoupeSource.#rendered.get(key);
    if (cached) {
      return cached;
    }

    const promise = (async () => {
      const image = await LoupeSource.#loadBitmap(req.src, req.fallbackSrc);
      try {
        const fromWorker = LoupeSource.#renderInWorker(req, image);
        if (fromWorker) {
          return await fromWorker;
        }
      } catch {}
      return LoupeSource.#renderOnMain(req, image);
    })();

    LoupeSource.#remember(key, promise);
    return promise;
  }

  static #dpr() {
    const value = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    return Math.min(2, value);
  }

  static #capDpr(cssWidth: number, cssHeight: number, value: number) {
    const max = Math.min(
      value,
      MAX_SOURCE_DIM / Math.max(1, cssWidth),
      MAX_SOURCE_DIM / Math.max(1, cssHeight),
    );
    return Math.max(1, Math.min(2, max));
  }

  static #cacheKey(req: LoupeSourceRequest) {
    return [
      req.stampId,
      Math.round(req.cssWidth),
      Math.round(req.cssHeight),
      req.dpr.toFixed(2),
      Math.round(req.stampWidth),
      Math.round(req.stampHeight),
      req.gridCellSize,
    ].join(':');
  }

  static async #fetchBitmap(src: string) {
    const response = await fetch(src, { cache: 'force-cache' });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${src}`);
    }
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    if (bitmap.width < 1 || bitmap.height < 1) {
      bitmap.close();
      throw new Error('Empty image bitmap');
    }
    return bitmap;
  }

  static #loadBitmap(src: string, fallbackSrc?: string) {
    const cached = LoupeSource.#bitmaps.get(src);
    if (cached) {
      return cached;
    }

    const promise = LoupeSource.#fetchBitmap(src).catch((error) => {
      if (fallbackSrc && fallbackSrc !== src) {
        return LoupeSource.#fetchBitmap(fallbackSrc);
      }
      throw error;
    });

    LoupeSource.#rememberBitmap(src, promise);
    return promise;
  }

  static #rememberBitmap(src: string, promise: Promise<ImageBitmap>) {
    LoupeSource.#bitmaps.set(src, promise);
    LoupeSource.#bitmapsOrder.push(src);
    promise.catch(() => {
      const index = LoupeSource.#bitmapsOrder.indexOf(src);
      if (index >= 0) {
        LoupeSource.#bitmapsOrder.splice(index, 1);
      }
      LoupeSource.#bitmaps.delete(src);
    });

    while (LoupeSource.#bitmapsOrder.length > MAX_BITMAPS) {
      const oldest = LoupeSource.#bitmapsOrder.shift();
      if (!oldest || oldest === src) {
        continue;
      }
      const stale = LoupeSource.#bitmaps.get(oldest);
      LoupeSource.#bitmaps.delete(oldest);
      void stale?.then((bitmap) => bitmap.close()).catch(() => undefined);
    }
  }

  static #getWorker() {
    if (LoupeSource.#worker !== undefined) {
      return LoupeSource.#worker;
    }

    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      LoupeSource.#worker = null;
      return LoupeSource.#worker;
    }

    try {
      const next = new Worker(new URL('./source.worker.ts', import.meta.url), { type: 'module' });
      next.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const job = LoupeSource.#pending.get(event.data.id);
        if (!job) {
          return;
        }
        LoupeSource.#pending.delete(event.data.id);
        if (event.data.type === 'result') {
          job.resolve(new LoupeSource(event.data.bitmap, event.data.cssWidth, event.data.cssHeight));
          return;
        }
        job.reject(new Error(event.data.error));
      };
      next.onerror = () => {
        LoupeSource.#worker = null;
        for (const job of LoupeSource.#pending.values()) {
          job.reject(new Error('Loupe worker failed'));
        }
        LoupeSource.#pending.clear();
      };
      LoupeSource.#worker = next;
    } catch {
      LoupeSource.#worker = null;
    }

    return LoupeSource.#worker;
  }

  static async #renderOnMain(req: LoupeSourceRequest, image: ImageBitmap) {
    const canvas = new LoupeSourceCanvas();
    canvas.paint({
      ...req,
      dpr: LoupeSource.#capDpr(req.cssWidth, req.cssHeight, req.dpr),
      image,
    });
    return new LoupeSource(await canvas.toFlippedBitmap(), req.cssWidth, req.cssHeight);
  }

  static #renderInWorker(req: LoupeSourceRequest, image: ImageBitmap) {
    const worker = LoupeSource.#getWorker();
    if (!worker) {
      return null;
    }

    return createImageBitmap(image).then(
      (clone) =>
        new Promise<LoupeSource>((resolve, reject) => {
          const id = ++LoupeSource.#requestId;
          LoupeSource.#pending.set(id, { resolve, reject });
          const payload: WorkerRequest = {
            id,
            bitmap: clone,
            cssWidth: req.cssWidth,
            cssHeight: req.cssHeight,
            dpr: LoupeSource.#capDpr(req.cssWidth, req.cssHeight, req.dpr),
            stampWidth: req.stampWidth,
            stampHeight: req.stampHeight,
            gridCellSize: req.gridCellSize,
            background: req.background,
            foreground: req.foreground,
          };
          worker.postMessage(payload, [clone]);
        }),
    );
  }

  static #remember(key: string, promise: Promise<LoupeSource>) {
    LoupeSource.#rendered.set(key, promise);
    LoupeSource.#renderedOrder.push(key);
    promise.catch(() => {
      const index = LoupeSource.#renderedOrder.indexOf(key);
      if (index >= 0) {
        LoupeSource.#renderedOrder.splice(index, 1);
      }
      LoupeSource.#rendered.delete(key);
    });

    while (LoupeSource.#renderedOrder.length > MAX_CACHE) {
      const oldest = LoupeSource.#renderedOrder.shift();
      if (!oldest || oldest === key) {
        continue;
      }
      const stale = LoupeSource.#rendered.get(oldest);
      LoupeSource.#rendered.delete(oldest);
      void stale?.then((source) => source.bitmap.close()).catch(() => undefined);
    }
  }
}
