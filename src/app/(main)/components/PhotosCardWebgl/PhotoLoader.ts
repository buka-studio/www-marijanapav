import * as THREE from 'three';

type TextureEntry = {
  texture: THREE.Texture | null;
  pending: Promise<void> | null;
  cancel: (() => void) | null;
  failures: number;
  retryAt: number;
};

type PhotoLoaderOptions = {
  width: number;
  quality: number;
  retryBaseMs?: number;
  retryMaxMs?: number;
};

const EMPTY_IMAGE_SRC = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

export default class PhotoLoader {
  readonly #urls: string[];
  readonly #entries: TextureEntry[];
  readonly #retryBaseMs: number;
  readonly #retryMaxMs: number;
  #version = 0;
  #consumers = 0;
  #fallbackTexture: THREE.Texture | null = null;

  constructor(sources: string[], options: PhotoLoaderOptions) {
    if (sources.length === 0) {
      throw new Error('PhotoLoader requires at least one image source.');
    }

    this.#urls = sources.map((src) => {
      const params = new URLSearchParams({
        url: src,
        w: String(options.width),
        q: String(options.quality),
      });
      return `/_next/image?${params.toString()}`;
    });
    this.#entries = sources.map(() => ({
      texture: null,
      pending: null,
      cancel: null,
      failures: 0,
      retryAt: 0,
    }));
    this.#retryBaseMs = options.retryBaseMs ?? 1000;
    this.#retryMaxMs = options.retryMaxMs ?? 30_000;
  }

  get version() {
    return this.#version;
  }

  get(index: number) {
    return this.#entries[this.#normalizeIndex(index)].texture;
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

  request(index: number) {
    this.#load(index)?.catch((error) => {
      console.error(error);
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
    for (const entry of this.#entries) {
      entry.cancel?.();
      entry.texture?.dispose();
      entry.texture = null;
      entry.pending = null;
      entry.cancel = null;
      entry.failures = 0;
      entry.retryAt = 0;
    }

    this.#fallbackTexture?.dispose();
    this.#fallbackTexture = null;
    this.#version += 1;
  }

  #normalizeIndex(index: number) {
    return ((index % this.#entries.length) + this.#entries.length) % this.#entries.length;
  }

  #load(index: number) {
    const photoIndex = this.#normalizeIndex(index);
    const entry = this.#entries[photoIndex];
    if (entry.texture || entry.pending) {
      return entry.pending;
    }
    if (entry.retryAt > Date.now()) {
      return null;
    }

    let settled = false;
    let resolvePending: () => void;
    let rejectPending: (reason: unknown) => void;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    const pending = new Promise<void>((resolve, reject) => {
      resolvePending = resolve;
      rejectPending = reject;
    });
    entry.pending = pending;

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      entry.pending = null;
      entry.cancel = null;
    };

    const finish = () => {
      if (settled || !image.complete || image.naturalWidth === 0) {
        return;
      }

      settled = true;
      cleanup();
      entry.texture = this.#textureFromSource(image);
      entry.failures = 0;
      entry.retryAt = 0;
      this.#version += 1;
      resolvePending();
    };

    entry.cancel = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      image.src = EMPTY_IMAGE_SRC;
      resolvePending();
    };
    image.onload = finish;
    image.onerror = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      entry.failures += 1;
      entry.retryAt =
        Date.now() + Math.min(this.#retryMaxMs, this.#retryBaseMs * 2 ** (entry.failures - 1));
      this.#version += 1;
      rejectPending(new Error(`Failed to load ${this.#urls[photoIndex]}`));
    };
    image.src = this.#urls[photoIndex];
    finish();

    return pending;
  }

  #textureFromSource(source: TexImageSource) {
    const texture = new THREE.Texture(source);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }
}
