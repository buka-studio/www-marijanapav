import * as THREE from 'three';

import cloudflareLoader from '~/image-loader';

type TextureEntry = {
  texture: THREE.Texture | null;
  pending: Promise<void> | null;
  cancel: (() => void) | null;
  failures: number;
  retryAt: number;
  gpuReady: boolean;
};

export type ImageTextureLoaderOptions = {
  width: number;
  quality: number;
  retryBaseMs?: number;
  retryMaxMs?: number;
  maxInflight?: number;
};

const EMPTY_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const BITMAP_OPTIONS: ImageBitmapOptions = {
  imageOrientation: 'flipY',
  colorSpaceConversion: 'none',
  premultiplyAlpha: 'none',
};

function isAbortError(error: unknown) {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

function moveToFront(queue: number[], index: number) {
  const existing = queue.indexOf(index);
  if (existing === 0) {
    return;
  }
  if (existing > 0) {
    queue.splice(existing, 1);
  }
  queue.unshift(index);
}

function removeIndex(queue: number[], index: number) {
  const existing = queue.indexOf(index);
  if (existing !== -1) {
    queue.splice(existing, 1);
  }
}

export default class ImageTextureLoader {
  readonly #urls: string[];
  readonly #entries: TextureEntry[];
  readonly #retryBaseMs: number;
  readonly #retryMaxMs: number;
  readonly #maxInflight: number;
  #version = 0;
  #consumers = 0;
  #fallbackTexture: THREE.Texture | null = null;
  #renderer: THREE.WebGLRenderer | null = null;
  #loadQueue: number[] = [];
  #uploadQueue: number[] = [];
  #inflight = 0;

  constructor(sources: string[], options: ImageTextureLoaderOptions) {
    if (sources.length === 0) {
      throw new Error('ImageTextureLoader requires at least one image source.');
    }

    this.#urls = sources.map((src) =>
      cloudflareLoader({ src, width: options.width, quality: options.quality }),
    );
    this.#entries = sources.map(() => ({
      texture: null,
      pending: null,
      cancel: null,
      failures: 0,
      retryAt: 0,
      gpuReady: false,
    }));
    this.#retryBaseMs = options.retryBaseMs ?? 1000;
    this.#retryMaxMs = options.retryMaxMs ?? 30_000;
    this.#maxInflight = options.maxInflight ?? 4;
  }

  get version() {
    return this.#version;
  }

  get hasPendingUploads() {
    return this.#uploadQueue.length > 0;
  }

  get isWarming() {
    return this.#inflight > 0 || this.#loadQueue.length > 0 || this.#uploadQueue.length > 0;
  }

  get(index: number) {
    const entry = this.#entries[this.#normalizeIndex(index)];
    if (!entry.texture) {
      return null;
    }
    if (this.#renderer && !entry.gpuReady) {
      return null;
    }
    return entry.texture;
  }

  getFallback() {
    if (!this.#fallbackTexture) {
      const texture = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
      texture.needsUpdate = true;
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      this.#fallbackTexture = texture;
    }
    return this.#fallbackTexture;
  }

  needsGpuUpload(index: number) {
    const entry = this.#entries[this.#normalizeIndex(index)];
    return Boolean(entry.texture && !entry.gpuReady);
  }

  attachRenderer(renderer: THREE.WebGLRenderer) {
    this.#renderer = renderer;
    renderer.initTexture(this.getFallback());

    for (let i = 0; i < this.#entries.length; i += 1) {
      const entry = this.#entries[i];
      if (entry.texture && !entry.gpuReady) {
        this.#enqueueUpload(i);
      }
    }
  }

  detachRenderer() {
    this.#renderer = null;
  }

  uploadPending(max = 1) {
    if (!this.#renderer || max <= 0) {
      return 0;
    }

    let uploaded = 0;
    while (uploaded < max && this.#uploadQueue.length > 0) {
      const index = this.#uploadQueue.shift();
      if (index === undefined) {
        break;
      }

      const entry = this.#entries[index];
      if (!entry.texture || entry.gpuReady) {
        continue;
      }

      this.#renderer.initTexture(entry.texture);
      entry.texture.needsUpdate = false;
      entry.gpuReady = true;
      this.#version += 1;
      uploaded += 1;
    }

    return uploaded;
  }

  request(index: number) {
    this.#load(index, true)?.catch((error) => {
      if (!isAbortError(error)) {
        console.error(error);
      }
    });
  }

  requestAround(center: number, radius: number) {
    let nextRetryAt = 0;
    const now = Date.now();

    for (let offset = -radius; offset <= radius; offset += 1) {
      const index = this.#normalizeIndex(center + offset);
      this.request(index);
      const entry = this.#entries[index];
      if (!entry.texture && !entry.pending && entry.retryAt > now) {
        nextRetryAt = nextRetryAt === 0 ? entry.retryAt : Math.min(nextRetryAt, entry.retryAt);
      }
    }

    return nextRetryAt;
  }

  requestAll() {
    for (let i = 0; i < this.#entries.length; i += 1) {
      this.#enqueueLoad(i);
    }
    this.#startQueuedLoads();
  }

  prioritizeAround(center: number, radius: number) {
    for (let distance = radius; distance >= 0; distance -= 1) {
      if (distance === 0) {
        this.#prioritize(center);
        continue;
      }
      this.#prioritize(center + distance);
      this.#prioritize(center - distance);
    }
    this.#startQueuedLoads();
  }

  retain() {
    this.#consumers += 1;
  }

  release() {
    this.#consumers = Math.max(0, this.#consumers - 1);
    if (this.#consumers === 0) {
      this.dispose();
    }
  }

  dispose() {
    this.#loadQueue = [];
    this.#uploadQueue = [];
    this.#inflight = 0;
    this.#renderer = null;

    for (const entry of this.#entries) {
      entry.cancel?.();
      this.#disposeTexture(entry.texture);
      entry.texture = null;
      entry.pending = null;
      entry.cancel = null;
      entry.failures = 0;
      entry.retryAt = 0;
      entry.gpuReady = false;
    }

    this.#fallbackTexture?.dispose();
    this.#fallbackTexture = null;
    this.#version += 1;
  }

  #prioritize(index: number) {
    const photoIndex = this.#normalizeIndex(index);
    const entry = this.#entries[photoIndex];
    this.request(photoIndex);
    if (entry.texture && !entry.gpuReady) {
      this.#enqueueUpload(photoIndex, true);
    }
  }

  #enqueueLoad(index: number) {
    const photoIndex = this.#normalizeIndex(index);
    const entry = this.#entries[photoIndex];
    if (entry.texture || entry.pending || this.#loadQueue.includes(photoIndex)) {
      return;
    }
    this.#loadQueue.push(photoIndex);
  }

  #enqueueUpload(index: number, front = false) {
    const photoIndex = this.#normalizeIndex(index);
    const entry = this.#entries[photoIndex];
    if (!entry.texture || entry.gpuReady) {
      return;
    }
    if (front) {
      moveToFront(this.#uploadQueue, photoIndex);
      return;
    }
    if (!this.#uploadQueue.includes(photoIndex)) {
      this.#uploadQueue.push(photoIndex);
    }
  }

  #startQueuedLoads() {
    while (this.#inflight < this.#maxInflight && this.#loadQueue.length > 0) {
      const index = this.#loadQueue.shift();
      if (index === undefined) {
        break;
      }

      const pending = this.#load(index, false);
      if (!pending) {
        continue;
      }

      this.#inflight += 1;
      pending.finally(() => {
        this.#inflight = Math.max(0, this.#inflight - 1);
        this.#startQueuedLoads();
      });
    }
  }

  #normalizeIndex(index: number) {
    return ((index % this.#entries.length) + this.#entries.length) % this.#entries.length;
  }

  #load(index: number, urgent = false) {
    const photoIndex = this.#normalizeIndex(index);
    const entry = this.#entries[photoIndex];
    if (entry.texture || entry.pending) {
      return entry.pending;
    }
    if (entry.retryAt > Date.now()) {
      return null;
    }

    removeIndex(this.#loadQueue, photoIndex);

    const controller = new AbortController();
    let settled = false;
    let resolvePending: () => void = () => undefined;
    let rejectPending: (reason: unknown) => void = () => undefined;
    const pending = new Promise<void>((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });
    entry.pending = pending;

    const finish = () => {
      entry.pending = null;
      entry.cancel = null;
    };

    entry.cancel = () => {
      if (settled) {
        return;
      }
      settled = true;
      controller.abort();
      finish();
      resolvePending();
    };

    void this.#decodeSource(this.#urls[photoIndex], controller.signal, urgent)
      .then((source) => {
        if (settled) {
          this.#closeSource(source);
          return;
        }

        settled = true;
        finish();
        entry.texture = this.#textureFromSource(source);
        entry.failures = 0;
        entry.retryAt = 0;
        entry.gpuReady = false;

        if (this.#renderer) {
          this.#enqueueUpload(photoIndex);
        } else {
          this.#version += 1;
        }

        resolvePending();
      })
      .catch((error) => {
        if (settled || isAbortError(error)) {
          if (!settled) {
            settled = true;
            finish();
            resolvePending();
          }
          return;
        }

        settled = true;
        finish();
        entry.failures += 1;
        entry.retryAt =
          Date.now() + Math.min(this.#retryMaxMs, this.#retryBaseMs * 2 ** (entry.failures - 1));
        this.#version += 1;
        rejectPending(new Error(`Failed to load ${this.#urls[photoIndex]}`));
      });

    return pending;
  }

  async #decodeSource(url: string, signal: AbortSignal, urgent = false) {
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit',
        priority: urgent ? 'high' : 'low',
        signal,
      });
      if (!response.ok) {
        throw new Error(`Failed to load ${url}`);
      }

      const blob = await response.blob();
      if (typeof createImageBitmap === 'function') {
        try {
          return await createImageBitmap(blob, BITMAP_OPTIONS);
        } catch {
          return await this.#imageFromBlob(blob, signal);
        }
      }

      return await this.#imageFromBlob(blob, signal);
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      return await this.#imageFromUrl(url, signal);
    }
  }

  #imageFromBlob(blob: Blob, signal: AbortSignal) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';

      const cleanup = () => {
        URL.revokeObjectURL(objectUrl);
        image.onload = null;
        image.onerror = null;
      };

      const onAbort = () => {
        cleanup();
        image.src = EMPTY_IMAGE_SRC;
        reject(new DOMException('Aborted', 'AbortError'));
      };

      signal.addEventListener('abort', onAbort, { once: true });
      image.onload = () => {
        signal.removeEventListener('abort', onAbort);
        cleanup();
        resolve(image);
      };
      image.onerror = () => {
        signal.removeEventListener('abort', onAbort);
        cleanup();
        reject(new Error('Image decode failed.'));
      };
      image.src = objectUrl;
    });
  }

  #imageFromUrl(url: string, signal: AbortSignal) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.decoding = 'async';

      const cleanup = () => {
        image.onload = null;
        image.onerror = null;
      };

      const onAbort = () => {
        cleanup();
        image.src = EMPTY_IMAGE_SRC;
        reject(new DOMException('Aborted', 'AbortError'));
      };

      signal.addEventListener('abort', onAbort, { once: true });
      image.onload = () => {
        if (!image.complete || image.naturalWidth === 0) {
          signal.removeEventListener('abort', onAbort);
          cleanup();
          reject(new Error('Image decode failed.'));
          return;
        }
        signal.removeEventListener('abort', onAbort);
        cleanup();
        resolve(image);
      };
      image.onerror = () => {
        signal.removeEventListener('abort', onAbort);
        cleanup();
        reject(new Error(`Failed to load ${url}`));
      };
      image.src = url;
    });
  }

  #textureFromSource(source: TexImageSource) {
    const texture = new THREE.Texture(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = 1;
    texture.flipY = !(typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap);
    texture.needsUpdate = true;
    return texture;
  }

  #disposeTexture(texture: THREE.Texture | null) {
    if (!texture) {
      return;
    }
    this.#closeSource(texture.image);
    texture.dispose();
  }

  #closeSource(source: unknown) {
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
      source.close();
    }
  }
}
