const SPANS = {
  '--book-cover-leather-image': 0.3,
  '--book-cover-cloth-image': 0.24,
  '--book-paper-grain-image': 0.32,
} as const;

const MOST = 512;
const SLACK = 0.04;

const drawn = new Map<string, { made: Promise<string | undefined>; held: number }>();

function repaints(agent: string) {
  return /AppleWebKit\//.test(agent) && !/Chrom(?:e|ium)\//.test(agent);
}

function svgOf(value: string) {
  const url = /^url\(\s*(["']?)(.*)\1\s*\)$/s.exec(value.trim())?.[2];
  return url && /^data:image\/svg\+xml[;,]/i.test(url) ? url : undefined;
}

function sizeFor(width: number, span: number) {
  return Math.max(1, Math.round(width * span));
}

function scaleFor(size: number, ratio: number) {
  const screen = ratio > 0 && Number.isFinite(ratio) ? ratio : 1;
  return Math.max(1, Math.min(screen, Math.floor(MOST / size)));
}

function textOf(source: string) {
  const parts = /^data:image\/svg\+xml((?:;[^,;]*)*),(.*)$/is.exec(source);
  if (!parts) return undefined;
  try {
    return /;base64$/i.test(parts[1]!)
      ? new TextDecoder().decode(Uint8Array.from(atob(parts[2]!), (char) => char.charCodeAt(0)))
      : decodeURIComponent(parts[2]!);
  } catch {
    return undefined;
  }
}

function sized(source: string, size: number) {
  const text = textOf(source);
  if (text === undefined) return undefined;
  const root = /<svg\b[^>]*>/i.exec(text);
  if (!root) return undefined;
  const said = (name: string) => new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(root[0]);
  const box = said('viewBox')?.[2]
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const own = [
    Number.parseFloat(said('width')?.[2] ?? ''),
    Number.parseFloat(said('height')?.[2] ?? ''),
  ];
  const [wide, tall] = box?.length === 4 ? [box[2]!, box[3]!] : own;
  const height = wide! > 0 && tall! > 0 ? Math.max(1, Math.round((size * tall!) / wide!)) : size;
  const tag = root[0]
    .replace(/\s(?:width|height)\s*=\s*(["']).*?\1/gi, '')
    .replace(/^<svg\b/i, `<svg width="${size}" height="${height}"`);
  const svg = text.slice(0, root.index) + tag + text.slice(root.index + root[0].length);
  return { url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`, height };
}

async function draw(source: string, size: number, scale: number, doc: Document) {
  const told = sized(source, size);
  if (!told) return undefined;
  const image = doc.createElement('img');
  image.src = told.url;
  await image.decode();
  const canvas = doc.createElement('canvas');
  canvas.width = Math.round(size * scale);
  canvas.height = Math.round(told.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return undefined;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done));
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  try {
    const made = doc.createElement('img');
    made.src = url;
    await made.decode();
    return url;
  } catch {
    URL.revokeObjectURL(url);
    return undefined;
  }
}

function take(source: string, size: number, scale: number, doc: Document) {
  const key = `${size} ${scale} ${source}`;
  let entry = drawn.get(key);
  if (!entry) {
    entry = { made: draw(source, size, scale, doc).catch(() => undefined), held: 0 };
    drawn.set(key, entry);
  }
  entry.held++;
  return key;
}

function give(key: string | undefined) {
  const entry = key === undefined ? undefined : drawn.get(key);
  if (!entry || --entry.held > 0) return;
  drawn.delete(key!);
  void entry.made.then((url) => {
    if (url) URL.revokeObjectURL(url);
  });
}

interface Texture {
  given: string;
  source: string | undefined;
  size: number;
  scale: number;
  asked: string | undefined;
  shown: string | undefined;
  url?: string;
}

function createTextures() {
  let host: HTMLElement | undefined;
  const textures = new Map<string, Texture>();

  function clear() {
    for (const [name, texture] of textures) {
      if (texture.shown) host?.style.removeProperty(name);
      give(texture.asked);
      if (texture.shown !== texture.asked) give(texture.shown);
    }
    textures.clear();
    host = undefined;
  }

  function bake(el: HTMLElement, width: number) {
    const doc = el.ownerDocument;
    const view = doc.defaultView;
    if (!view || !(width > 0) || typeof URL.createObjectURL !== 'function') return;
    if (!repaints(view.navigator.userAgent)) return;
    if (host !== el) clear();
    host = el;
    const above = el.parentElement ? view.getComputedStyle(el.parentElement) : undefined;
    for (const [name, span] of Object.entries(SPANS)) {
      const given = above?.getPropertyValue(name).trim() ?? '';
      const size = sizeFor(width, span);
      const scale = scaleFor(size, view.devicePixelRatio);
      const was = textures.get(name);
      const same = was?.given === given && was.scale === scale;
      if (was && same && Math.abs(size - was.size) <= was.size * SLACK) continue;
      let source = was?.source;
      let shown = was?.shown;
      if (was && was.asked !== was.shown) give(was.asked);
      if (was?.given !== given) {
        if (shown) el.style.removeProperty(name);
        give(shown);
        shown = undefined;
        source = svgOf(view.getComputedStyle(el).getPropertyValue(name));
      }
      const asked = source ? take(source, size, scale, doc) : undefined;
      const texture: Texture = {
        given,
        source,
        size,
        scale,
        asked,
        shown,
        url: shown ? was?.url : undefined,
      };
      textures.set(name, texture);
      if (!asked) continue;
      if (asked === shown) {
        give(asked);
        continue;
      }
      void drawn.get(asked)!.made.then((url) => {
        if (!url || host !== el || textures.get(name) !== texture) return;
        el.style.setProperty(name, `url("${url}")`);
        give(texture.shown);
        texture.shown = asked;
        texture.url = url;
      });
    }
  }

  function source(name: string, value: string) {
    const own = svgOf(value);
    if (own) return own;
    const texture = textures.get(name);
    return texture?.url && value.includes(texture.url) ? texture.source : undefined;
  }

  return { bake, clear, source };
}

type Textures = ReturnType<typeof createTextures>;

export { createTextures, repaints, scaleFor, sized, sizeFor, SPANS, svgOf, textOf };
export type { Textures };
