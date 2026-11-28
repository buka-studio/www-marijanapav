import { turnedFor } from '../core';
import { reducedMotion, type Scene } from './scene';
import type { BookState } from './state';
import { sizeFor, SPANS, textOf, type Textures } from './textures';

const SVG = 'http://www.w3.org/2000/svg';

const REACH = 0.8;
const BUDGET = 1_000_000;
const CONE = 50;
const FOCUS = 8;
const GLIDE = 70;
const FADE = 400;

const SHINE = {
  leather: { exponent: 28, constant: 0.9 },
  cloth: { exponent: 12, constant: 0.6 },
  smooth: { exponent: 20, constant: 0.5 },
} as const;

function reachFor(width: number, ratio: number) {
  const screen = ratio > 0 && Number.isFinite(ratio) ? ratio : 1;
  return Math.min(width * REACH, Math.sqrt(BUDGET) / screen / 2);
}

function boxFor(x: number, y: number, reach: number, width: number, height: number) {
  const left = Math.max(0, x - reach);
  const top = Math.max(0, y - reach);
  const right = Math.min(width, x + reach);
  const bottom = Math.min(height, y + reach);
  return right > left && bottom > top
    ? { x: left, y: top, width: right - left, height: bottom - top }
    : undefined;
}

interface Relief {
  steps: Element[];
  input: string | null;
  scale: number;
  tile: number;
}

const reliefs = new Map<string, Relief | undefined>();

function reliefOf(source: string, view: Window & typeof globalThis): Relief | undefined {
  if (reliefs.has(source)) return reliefs.get(source);
  let relief: Relief | undefined;
  const text = textOf(source);
  if (text !== undefined && typeof view.DOMParser === 'function') {
    const doc = new view.DOMParser().parseFromString(text, 'image/svg+xml');
    const light = doc.querySelector('feDiffuseLighting, feSpecularLighting');
    const root = doc.documentElement;
    const box = root
      .getAttribute('viewBox')
      ?.trim()
      .split(/[\s,]+/)
      .map(Number);
    const tile = box?.length === 4 ? box[2]! : Number.parseFloat(root.getAttribute('width') ?? '');
    if (light?.parentElement && tile > 0) {
      const steps: Element[] = [];
      for (const step of Array.from(light.parentElement.children)) {
        if (step === light) break;
        steps.push(step);
      }
      relief = {
        steps,
        input: light.getAttribute('in'),
        scale: Number.parseFloat(light.getAttribute('surfaceScale') ?? '') || 1,
        tile,
      };
    }
  }
  reliefs.set(source, relief);
  return relief;
}

function copy(from: Element, doc: Document): Element | undefined {
  if (!/^fe[A-Z]/.test(from.localName)) return undefined;
  const el = doc.createElementNS(SVG, from.localName);
  for (const { name, value } of Array.from(from.attributes)) {
    if (/^on/i.test(name) || /href$/i.test(name) || /^xmlns/i.test(name) || name === 'style')
      continue;
    el.setAttribute(name, value);
  }
  for (const child of Array.from(from.children)) {
    const made = copy(child, doc);
    if (made) el.appendChild(made);
  }
  return el;
}

interface Light {
  svg: SVGElement;
  lit: Element;
  spot: Element;
  width: number;
  height: number;
  unit: number;
  reach: number;
  on: boolean;
  fresh: boolean;
  going: ReturnType<typeof setTimeout> | undefined;
}

interface LampOptions {
  scene: Scene;
  state(): BookState;
  textures: Textures;
  folding(): boolean;
}

let made = 0;

function createLamp({ scene, state, textures, folding }: LampOptions) {
  let pointer: { x: number; y: number } | undefined;
  let at: { x: number; y: number } | undefined;
  let frame = 0;
  let glided = 0;
  let out = false;
  const lights = new Map<HTMLElement, Light | null>();
  const places = new WeakMap<HTMLElement, DOMRect>();

  const boards = () => {
    const { page, columns } = state();
    const turned = turnedFor(page, columns);
    const found: HTMLElement[] = [];
    for (const index of columns === 2 ? [turned * 2 - 1, turned * 2] : [turned]) {
      const paper = scene.papers.get(index);
      if (paper?.hasAttribute('data-hard')) found.push(paper);
    }
    return found;
  };

  const make = (board: HTMLElement): Light | null => {
    const doc = board.ownerDocument;
    const view = doc.defaultView;
    const finish = board.querySelector<HTMLElement>(':scope > [data-slot="book-page-finish"]');
    if (!view || !finish) return null;
    const style = view.getComputedStyle(board);
    const share = (name: string) =>
      Math.min(1, Math.max(0, Number.parseFloat(style.getPropertyValue(name)) || 0));
    if (share('--book-cover-sheen') <= 0) return null;
    const width = Number.parseFloat(style.width);
    const height = Number.parseFloat(style.height);
    if (!(width > 0 && height > 0)) return null;

    const leather = share('--book-cover-leather');
    const cloth = share('--book-cover-cloth');
    const kind = leather <= 0 && cloth <= 0 ? 'smooth' : leather >= cloth ? 'leather' : 'cloth';
    let relief: Relief | undefined;
    let unit = 1;
    if (kind !== 'smooth') {
      const name = `--book-cover-${kind}-image` as const;
      const source = textures.source(name, style.getPropertyValue(name));
      relief = source ? reliefOf(source, view) : undefined;
      const whole = view.CSS?.supports?.('width', 'round(1px, 1px)') === true;
      const laid = whole ? sizeFor(width, SPANS[name]) : width * SPANS[name];
      if (relief) unit = relief.tile / laid;
    }

    const across = width * unit;
    const down = height * unit;
    const reach = reachFor(width, view.devicePixelRatio);
    const id = `book-lamp-${++made}`;
    const el = (name: string, attrs: Record<string, string | number>) => {
      const node = doc.createElementNS(SVG, name);
      for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
      return node;
    };
    const svg = el('svg', {
      'data-slot': 'book-lamp',
      viewBox: `0 0 ${across} ${down}`,
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
      focusable: 'false',
    });
    const filter = el('filter', {
      id,
      filterUnits: 'userSpaceOnUse',
      x: 0,
      y: 0,
      width: across,
      height: down,
      'color-interpolation-filters': 'sRGB',
    });
    if (relief) {
      for (const step of relief.steps) {
        const part = copy(step, doc);
        if (part) filter.appendChild(part);
      }
    } else {
      filter.appendChild(el('feFlood', { 'flood-opacity': 1 }));
    }
    const shine = SHINE[relief ? kind : 'smooth'];
    const lit = el('feSpecularLighting', {
      surfaceScale: relief ? relief.scale * (kind === 'leather' ? leather : cloth) : 1,
      specularConstant: shine.constant,
      specularExponent: shine.exponent,
      'lighting-color': '#fff',
      ...(relief?.input ? { in: relief.input } : undefined),
    });
    const spot = el('feSpotLight', {
      z: (reach * unit) / Math.tan((CONE * Math.PI) / 180),
      pointsAtZ: 0,
      specularExponent: FOCUS,
      limitingConeAngle: CONE,
    });
    lit.appendChild(spot);
    filter.appendChild(lit);
    svg.appendChild(filter);
    svg.appendChild(el('rect', { width: across, height: down, filter: `url(#${id})` }));
    finish.appendChild(svg);
    return {
      svg: svg as SVGElement,
      lit,
      spot,
      width,
      height,
      unit,
      reach,
      on: false,
      fresh: true,
      going: undefined,
    };
  };

  const remove = (board: HTMLElement, light: Light | null) => {
    if (light) {
      clearTimeout(light.going);
      light.svg.remove();
    }
    if (lights.get(board) === light) lights.delete(board);
  };

  const dim = (board: HTMLElement, light: Light) => {
    if (light.going !== undefined) return;
    light.on = false;
    light.svg.removeAttribute('data-lit');
    light.going = setTimeout(() => remove(board, light), FADE);
  };

  const step = (time: number) => {
    frame = 0;
    if (!pointer || !folding()) return;
    if ((scene.turns?.active.length ?? 0) > 0) {
      out = true;
      return;
    }
    const from = at ?? pointer;
    const part = 1 - Math.exp(-Math.min(64, time - glided) / GLIDE);
    glided = time;
    const near = Math.hypot(pointer.x - from.x, pointer.y - from.y) < 0.5;
    at = near
      ? pointer
      : { x: from.x + (pointer.x - from.x) * part, y: from.y + (pointer.y - from.y) * part };
    let more = !near;

    const inView = boards();
    for (const [board, light] of lights) {
      if (inView.includes(board)) continue;
      if (light) dim(board, light);
      else lights.delete(board);
    }
    const ratio = scene.el?.ownerDocument.defaultView?.devicePixelRatio ?? 1;
    for (const board of inView) {
      const rect = board.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0)) continue;
      let light = lights.get(board);
      if (board.checkVisibility?.({ visibilityProperty: true }) === false) {
        if (light) dim(board, light);
        continue;
      }
      const was = places.get(board);
      places.set(board, rect);
      const still =
        was !== undefined &&
        Math.abs(rect.left - was.left) < 0.5 &&
        Math.abs(rect.top - was.top) < 0.5 &&
        Math.abs(rect.width - was.width) < 0.5 &&
        Math.abs(rect.height - was.height) < 0.5;
      if (!still) {
        if (light) dim(board, light);
        if (!was) more = true;
        continue;
      }
      if (light === undefined) {
        const reach = reachFor(rect.width, ratio);
        if (!boxFor(at.x - rect.left, at.y - rect.top, reach, rect.width, rect.height)) continue;
        light = make(board);
        lights.set(board, light);
      }
      if (!light) continue;
      const x = ((at.x - rect.left) / rect.width) * light.width;
      const y = ((at.y - rect.top) / rect.height) * light.height;
      const box = boxFor(x, y, light.reach, light.width, light.height);
      if (!box) {
        dim(board, light);
        continue;
      }
      const { unit } = light;
      light.spot.setAttribute('x', String(x * unit));
      light.spot.setAttribute('y', String(y * unit));
      light.spot.setAttribute('pointsAtX', String(x * unit));
      light.spot.setAttribute('pointsAtY', String(y * unit));
      light.lit.setAttribute('x', String(box.x * unit));
      light.lit.setAttribute('y', String(box.y * unit));
      light.lit.setAttribute('width', String(box.width * unit));
      light.lit.setAttribute('height', String(box.height * unit));
      if (light.fresh) {
        light.fresh = false;
        more = true;
      } else if (!light.on) {
        clearTimeout(light.going);
        light.going = undefined;
        light.on = true;
        light.svg.setAttribute('data-lit', '');
      }
    }
    if (more) frame = requestAnimationFrame(step);
  };

  const wake = () => {
    if (frame !== 0) return;
    glided = performance.now();
    frame = requestAnimationFrame(step);
  };

  const douse = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const [board, light] of lights) {
      if (light) dim(board, light);
      else lights.delete(board);
    }
  };

  const clear = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    for (const [board, light] of Array.from(lights)) remove(board, light);
    lights.clear();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || reducedMotion()) {
      if (pointer) {
        pointer = at = undefined;
        douse();
      }
      return;
    }
    pointer = { x: event.clientX, y: event.clientY };
    wake();
  };

  const onPointerGone = () => {
    pointer = at = undefined;
    douse();
  };

  return {
    bind(el: HTMLElement) {
      const root = el.ownerDocument.documentElement;
      root.addEventListener('pointermove', onPointerMove, { passive: true });
      root.addEventListener('pointerleave', onPointerGone);
      return () => {
        root.removeEventListener('pointermove', onPointerMove);
        root.removeEventListener('pointerleave', onPointerGone);
        pointer = at = undefined;
        out = false;
        clear();
      };
    },

    follow(turning: boolean) {
      if (!folding()) {
        clear();
      } else if (turning) {
        if (lights.size > 0) douse();
        out = true;
      } else if (out) {
        out = false;
        if (pointer) wake();
      }
    },

    resize() {
      if (lights.size === 0) return;
      clear();
      if (pointer) wake();
    },
  };
}

export { boxFor, createLamp, reachFor };
