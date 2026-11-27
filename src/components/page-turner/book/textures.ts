/**
 * Draws a book's textures (leather, cloth, paper grain: SVGs whose filters draw from noise) to bitmaps, once,
 * in Safari only. Safari caches no picture of an SVG background: it reruns the filter on every paint, so on
 * every page that lifts or lands. The stylesheet's SVG still shows in the server's HTML, until the bitmap is
 * ready, and if none can be made. Other browsers cache the SVG at the screen's pixels, where a bitmap would
 * be coarser and save nothing. Only an SVG written into the stylesheet as a `data:` URL is drawn.
 *
 * The bitmap must match the SVG's pixels. Safari runs an SVG's filters at the SVG's stated size, one pixel
 * to the px, then scales to the screen's pixels. In a canvas that size is the SVG's own (150px if it states
 * none), whatever size it is drawn: a different picture. So the SVG is first given the width the stylesheet
 * lays it, a whole number of px, then drawn at the screen's pixels.
 */

/**
 * The custom properties that name the textures, and how wide the stylesheet lays each, in page widths.
 * `--book-cover-leather-size` and the others say the same there, to the nearest px.
 */
const SPANS = {
  '--book-cover-leather-image': 0.3,
  '--book-cover-cloth-image': 0.24,
  '--book-paper-grain-image': 0.32,
} as const;

/** Most pixels across a bitmap, where the screen's pixels would make it more. */
const MOST = 512;
/** How far a page may resize, as a share of its width, before its bitmaps are redrawn. */
const SLACK = 0.04;

/** Every bitmap in use, keyed by size, scale and source: its URL, and how many books hold it. Like books share. */
const drawn = new Map<string, { made: Promise<string | undefined>; held: number }>();

/** Whether `agent` is Safari's engine (every browser on iOS too), which reruns an SVG background's filter per paint. */
function repaints(agent: string) {
  return /AppleWebKit\//.test(agent) && !/Chrom(?:e|ium)\//.test(agent);
}

/** The SVG a custom property names, when it is a `data:` URL. */
function svgOf(value: string) {
  const url = /^url\(\s*(["']?)(.*)\1\s*\)$/s.exec(value.trim())?.[2];
  return url && /^data:image\/svg\+xml[;,]/i.test(url) ? url : undefined;
}

/** Width in whole px, as the stylesheet lays it, of a picture `span` page widths wide on a page `width` px wide. */
function sizeFor(width: number, span: number) {
  return Math.max(1, Math.round(width * span));
}

/** Pixels per px for a picture `size` px across: the screen's `ratio`, or a whole number keeping it within `MOST`. */
function scaleFor(size: number, ratio: number) {
  const screen = ratio > 0 && Number.isFinite(ratio) ? ratio : 1;
  return Math.max(1, Math.min(screen, Math.floor(MOST / size)));
}

/** The text of an SVG `data:` URL. Undefined if it can't be read. */
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

/** The same SVG as a `data:` URL, stated `size` px wide and as tall as its shape makes that, with that height. */
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
    // The page may forbid `blob:` images: then it keeps the SVG.
    const made = doc.createElement('img');
    made.src = url;
    await made.decode();
    return url;
  } catch {
    URL.revokeObjectURL(url);
    return undefined;
  }
}

/** Holds a bitmap of `source`, `size` px across at `scale` pixels per px. Returns the key to `give` it back by. */
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

/** Gives a bitmap back. One no book holds any more is revoked. */
function give(key: string | undefined) {
  const entry = key === undefined ? undefined : drawn.get(key);
  if (!entry || --entry.held > 0) return;
  drawn.delete(key!);
  void entry.made.then((url) => {
    if (url) URL.revokeObjectURL(url);
  });
}

interface Texture {
  /** The property's value on the pages' parent. */
  given: string;
  /** The SVG it is drawn from, if it is one. */
  source: string | undefined;
  /** Its laid width in px, and the pixels per px it is drawn with. */
  size: number;
  scale: number;
  /** The bitmap asked for, and the one the pages show: the old one until the new is ready. */
  asked: string | undefined;
  shown: string | undefined;
  /** The shown bitmap's URL, as set on the pages. */
  url?: string;
}

function createTextures() {
  let host: HTMLElement | undefined;
  const textures = new Map<string, Texture>();

  /** Puts the pages back on the SVGs. */
  function clear() {
    for (const [name, texture] of textures) {
      if (texture.shown) host?.style.removeProperty(name);
      give(texture.asked);
      if (texture.shown !== texture.asked) give(texture.shown);
    }
    textures.clear();
    host = undefined;
  }

  /** Draws the textures of the pages in `el`, each `width` px wide. Call on every measure: what changed is redrawn. */
  function bake(el: HTMLElement, width: number) {
    const doc = el.ownerDocument;
    const view = doc.defaultView;
    if (!view || !(width > 0) || typeof URL.createObjectURL !== 'function') return;
    if (!repaints(view.navigator.userAgent)) return;
    if (host !== el) clear();
    host = el;
    // Read off the parent: the pages' own value is the bitmap once one is set.
    const above = el.parentElement ? view.getComputedStyle(el.parentElement) : undefined;
    for (const [name, span] of Object.entries(SPANS)) {
      const given = above?.getPropertyValue(name).trim() ?? '';
      const size = sizeFor(width, span);
      const scale = scaleFor(size, view.devicePixelRatio);
      const was = textures.get(name);
      // The window may have moved to a screen with another pixel ratio.
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
        // Back at the size of the one showing: hold it once, not twice.
        give(asked);
        continue;
      }
      void drawn.get(asked)!.made.then((url) => {
        // The book may have gone, or been given another texture, while this was drawn.
        if (!url || host !== el || textures.get(name) !== texture) return;
        el.style.setProperty(name, `url("${url}")`);
        give(texture.shown);
        texture.shown = asked;
        texture.url = url;
      });
    }
  }

  /** The SVG behind a page's `value` for the property `name`: the SVG itself, or the one its bitmap was drawn from. */
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
