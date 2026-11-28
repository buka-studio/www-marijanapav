import {
  fold,
  layOf,
  overRibbon,
  PLACE,
  type Columns,
  type Fold,
  type Laid,
  type Point,
  type Strip,
  type Turns,
} from '../core';
import { quieten } from '../takeover';

interface PageElements {
  slot: HTMLElement;
  clip: HTMLElement;
  content: HTMLElement;
  shade: HTMLElement;
  cast: HTMLElement;
  shadow: HTMLElement;
}

interface RendererOptions {
  page: (index: number) => PageElements | undefined;
  faces: (leaf: number) => { front: number; back: number };
  columns?: () => Columns;
  verso?: () => number;
  blanks?: () => readonly PageElements[];
  hard?: (leaf: number) => boolean;
  strip?: () => SVGSVGElement | undefined;
}

const SHADE_STRETCH = 120;
const CAST_STRETCH = 10;
const DISTANCE = 4.5;
const OVER = 'translate(100cqw,0) scaleX(-1)';

function createRenderer(options: RendererOptions) {
  let drawn = new Set<PageElements>();
  const standIns = new Map<number, PageElements>();

  function reset(page: PageElements) {
    page.slot.removeAttribute('data-turning');
    page.slot.removeAttribute('data-under');
    page.slot.removeAttribute('data-side');
    page.slot.removeAttribute('data-verso');
    unboard(page);
    unswing(page);
    page.slot.style.zIndex = '';
    page.clip.style.transform = '';
    page.content.style.transform = '';
    page.shade.style.transform = '';
    page.shade.style.opacity = '';
    page.cast.style.transform = '';
    page.cast.style.opacity = '';
    page.cast.removeAttribute('data-fall');
    page.shadow.style.transform = '';
  }

  function rest(page: PageElements, side: 'left' | 'right', verso?: 'paper' | 'board') {
    page.slot.removeAttribute('data-turning');
    page.slot.setAttribute('data-under', '');
    page.slot.setAttribute('data-side', side);
    if (verso) page.slot.setAttribute('data-verso', verso);
    else page.slot.removeAttribute('data-verso');
    unswing(page);
    page.slot.style.zIndex = '';
    page.clip.style.transform = '';
    page.content.style.transform = verso ? OVER : '';
    page.shade.style.opacity = '';
    page.cast.style.opacity = '';
  }

  const boards = new Map<PageElements, string>();

  function board(page: PageElements, cover: PageElements | undefined, side = false) {
    if (!cover) {
      unboard(page);
      return;
    }
    if (boards.has(page)) return;
    const face = side && page.content.hasAttribute('data-hard');
    const style = getComputedStyle((face ? page : cover).content);
    const colour = style.backgroundColor;
    boards.set(page, colour);
    page.slot.style.setProperty('--book-board', colour);
    page.slot.setAttribute('data-board', face ? 'face' : '');
    const strength = (name: string) => Number.parseFloat(style.getPropertyValue(name)) || 0;
    const leather = strength('--book-cover-leather');
    const cloth = strength('--book-cover-cloth');
    if (leather > 0 || cloth > 0) {
      page.slot.setAttribute('data-finish', leather >= cloth ? 'leather' : 'cloth');
      page.slot.style.setProperty('--book-board-finish', String(Math.max(leather, cloth)));
    }
    page.slot.style.setProperty('--book-board-sheen', String(strength('--book-cover-sheen')));
  }

  function unboard(page: PageElements) {
    if (!boards.delete(page)) return;
    page.slot.style.removeProperty('--book-board');
    page.slot.style.removeProperty('--book-board-finish');
    page.slot.style.removeProperty('--book-board-sheen');
    page.slot.removeAttribute('data-board');
    page.slot.removeAttribute('data-finish');
  }

  const swung = new Set<PageElements>();

  function unswing(page: PageElements) {
    if (!swung.delete(page)) return;
    page.slot.style.removeProperty('--book-swing');
    page.slot.style.removeProperty('--book-swing-shade');
    page.slot.style.removeProperty('--book-swing-cast');
  }

  function lift(page: PageElements, mode: '' | 'hard', z: number) {
    page.slot.setAttribute('data-turning', mode);
    page.slot.removeAttribute('data-under');
    page.slot.removeAttribute('data-side');
    page.slot.removeAttribute('data-verso');
    if (mode === '') {
      unboard(page);
      unswing(page);
    }
    page.slot.style.zIndex = String(z * 2);
  }

  const shown = new Map<
    SVGSVGElement,
    {
      paths: Record<string, string>;
      box: string;
      opacity: string;
      z: string;
      colour: string;
      covered: boolean;
    }
  >();
  const lain: Laid = { places: new Float64Array(0), runs: [], width: 0 };
  const crossed: number[] = [];

  function lay(strip: Strip, h: number, z: number, covered: boolean) {
    const svg = options.strip?.();
    if (!svg) return undefined;
    if (strip.opacity <= 0 || strip.count < 2) return undefined;
    let written = shown.get(svg);
    if (!written) {
      written = { paths: {}, box: '', opacity: '', z: '', colour: '', covered: false };
      shown.set(svg, written);
      svg.setAttribute('data-shown', '');
    }
    const box = `0 0 100 ${(h * 100).toFixed(3)}`;
    if (box !== written.box) {
      svg.setAttribute('viewBox', box);
      written.box = box;
    }
    layOf(strip, { slant: SLANT }, lain);
    crossingsOf(lain, crossed);
    for (const part of svg.querySelectorAll<SVGPathElement>('path')) {
      const kind = part.getAttribute('data-part') ?? '';
      const path = outline(lain, kind, crossed);
      if (path === written.paths[kind]) continue;
      part.setAttribute('d', path);
      written.paths[kind] = path;
    }
    const opacity = strip.opacity.toFixed(3);
    if (opacity !== written.opacity) svg.style.opacity = written.opacity = opacity;
    const level = String(z);
    if (level !== written.z) svg.style.zIndex = written.z = level;
    if (strip.colour !== written.colour) svg.style.color = written.colour = strip.colour;
    if (covered !== written.covered) {
      svg.toggleAttribute('data-covered', covered);
      written.covered = covered;
    }
    return svg;
  }

  function unlay(kept: Set<SVGSVGElement>) {
    for (const svg of shown.keys()) {
      if (kept.has(svg)) continue;
      svg.removeAttribute('data-shown');
      svg.removeAttribute('data-covered');
      svg.style.opacity = svg.style.zIndex = svg.style.color = '';
      shown.delete(svg);
    }
  }

  function shade(page: PageElements, at: Point, angle: number, strength: number) {
    page.shade.style.transform = `translate(${cqw(at.x)},${cqw(at.y)}) rotate(${rad(angle)}) scaleY(${SHADE_STRETCH})`;
    page.shade.style.opacity = strength.toFixed(3);
  }

  function shadeBeneath(page: PageElements, origin: Point, above: Fold | undefined) {
    if (above) {
      shade(
        page,
        { x: above.mid.x - origin.x, y: above.mid.y - origin.y },
        above.normal,
        curl(above.progress),
      );
    } else {
      page.shade.style.opacity = '0';
    }
  }

  function turn(
    page: PageElements,
    f: Fold,
    h: number,
    flap: boolean,
    z: number,
    fall: Fall = 'both',
  ) {
    lift(page, '', z);

    const at = flap ? f.flap : f.flat;
    const rotation = flap ? f.flapRotation : 0;
    const cos = Math.cos(f.normal);
    const sin = Math.sin(f.normal);

    page.clip.style.transform = `translate(${cqw(f.mid.x)},${cqw(f.mid.y - h / 2)}) rotate(${rad(f.normal)})`;
    const dx = at.x - f.mid.x;
    const dy = at.y - f.mid.y;
    const placed = `translate(${cqw(cos * dx + sin * dy)},${cqw(-sin * dx + cos * dy + h / 2)}) rotate(${rad(rotation - f.normal)})`;
    page.content.style.transform = placed;

    if (flap) {
      const turnCos = Math.cos(rotation);
      const turnSin = Math.sin(rotation);
      const mx = f.mid.x - at.x;
      const my = f.mid.y - at.y;
      const height = curl(f.progress);
      shade(
        page,
        { x: turnCos * mx + turnSin * my, y: -turnSin * mx + turnCos * my },
        f.normal - rotation,
        height,
      );
      page.cast.style.transform = `translate(${cqw(-cos * f.mid.x - sin * f.mid.y)},${cqw(sin * f.mid.x - cos * f.mid.y + h / 2)}) rotate(${rad(-f.normal)})`;
      page.cast.style.opacity = height.toFixed(3);
      if (fall === 'both') page.cast.removeAttribute('data-fall');
      else if (page.cast.getAttribute('data-fall') !== fall)
        page.cast.setAttribute('data-fall', fall);
      page.shadow.style.transform = `translate(${cqw(at.x)},${cqw(at.y)}) rotate(${rad(rotation)}) scale(${CAST_STRETCH})`;
    } else {
      page.cast.style.opacity = '0';
    }
  }

  function swing(page: PageElements, t: number, back: boolean, z: number, lone: boolean) {
    lift(page, 'hard', z);
    const angle = back ? (1 - t) * 180 : -t * 180;
    page.clip.style.transform = '';
    page.content.style.transform = `translate(0,50cqh) perspective(${cqw(DISTANCE)}) rotateY(${angle.toFixed(3)}deg) translate(${back ? '-100cqw' : '0'},-50cqh)`;
    const dark = (0.22 * Math.sin(Math.PI * t)).toFixed(3);
    page.shade.style.transform = '';
    page.shade.style.opacity = dark;
    page.cast.style.opacity = '0';
    swung.add(page);
    page.slot.style.setProperty(
      '--book-swing',
      `perspective(${cqw(DISTANCE)}) rotateY(${(-t * 180).toFixed(3)}deg)`,
    );
    page.slot.style.setProperty('--book-swing-shade', dark);
    page.slot.style.setProperty('--book-swing-cast', lone ? '1' : '0');
  }

  function standIn(leaf: number): PageElements | undefined {
    const held = standIns.get(leaf);
    if (held) return held;
    const taken = new Set(standIns.values());
    const spare = options.blanks?.().find((blank) => !taken.has(blank));
    if (spare) standIns.set(leaf, spare);
    return spare;
  }

  const copies = new Map<PageElements, { of: HTMLElement; el: HTMLElement | undefined }>();

  function show(spare: PageElements, page?: PageElements) {
    const held = copies.get(spare);
    if (held?.of === page?.content) return;
    held?.el?.remove();
    copies.delete(spare);
    if (!page) return;
    const through =
      Number.parseFloat(getComputedStyle(spare.slot).getPropertyValue('--book-show-through')) || 0;
    let el: HTMLElement | undefined;
    if (through > 0) {
      el = page.content.cloneNode(true) as HTMLElement;
      el.setAttribute('data-slot', 'book-page-copy');
      for (const name of ['role', 'tabindex', 'aria-label', 'aria-roledescription'])
        el.removeAttribute(name);
      el.style.transform = '';
      el.querySelector(':scope > [data-slot="book-page-shade"]')?.remove();
      quieten(el);
      spare.content.insertBefore(el, spare.content.firstChild);
    }
    copies.set(spare, { of: page.content, el });
  }

  function draw(turns: Turns, h: number, ribbon?: Strip) {
    const next = new Set<PageElements>();
    const lone = options.columns?.() === 1;
    let over = Infinity;
    const lies = (leaf: number, side: -1 | 1, z: number) => {
      if (ribbon && overRibbon(ribbon, leaf, side)) over = Math.min(over, z);
    };
    const { active, under } = turns;
    const folds = active.map((leaf) =>
      options.hard?.(leaf.index) ? undefined : fold(leaf.point, leaf.corner, h, leaf.from),
    );

    for (const [leaf, spare] of standIns) {
      if (active.some((item) => item.index === leaf)) continue;
      show(spare);
      standIns.delete(leaf);
    }

    const last = turns.leafCount - 1;
    const frontCover =
      last >= 0 && options.hard?.(0) ? options.page(options.faces(0).front) : undefined;
    const end = last >= 0 ? options.faces(last) : undefined;
    const backCover =
      end && options.hard?.(last) ? options.page(end.back >= 0 ? end.back : end.front) : undefined;

    for (let index = 0; index < active.length; index++) {
      const leaf = active[index]!;
      const f = folds[index];
      const faces = options.faces(leaf.index);
      const front = options.page(faces.front);
      const back = faces.back >= 0 ? options.page(faces.back) : standIn(leaf.index);
      if (back && faces.back < 0) show(back, lone && f ? front : undefined);

      if (!f) {
        const facing = leaf.t > 0.5 ? back : front;
        const right = leaf.from === 'right';
        const lifted = right ? leaf.t >= 0.5 : leaf.t <= 0.5;
        const z = right
          ? lifted
            ? 2000 + index
            : 1000 - index
          : lifted
            ? 3000 - index
            : 1000 + index;
        if (facing) {
          const lone = leaf.t > 0.5 ? under.left < 0 : under.right >= turns.leafCount;
          swing(facing, leaf.t, leaf.t > 0.5, z, lone);
          board(
            facing,
            leaf.index === 0 ? frontCover : leaf.index === last ? backCover : undefined,
            true,
          );
          lies(leaf.index, right === lifted ? -1 : 1, z);
          next.add(facing);
        }
        continue;
      }

      const right = f.from === 'right';
      const flat = right ? front : back;
      const flap = right ? back : front;
      const beside = folds[right ? index - 1 : index + 1];
      const ahead = beside?.from === f.from ? beside : undefined;
      if (flat) {
        turn(flat, f, h, false, right ? 1000 - index : 1000 + index);
        lies(leaf.index, right ? 1 : -1, right ? 1000 - index : 1000 + index);
        shadeBeneath(flat, f.flat, ahead);
        next.add(flat);
      }
      if (flap) {
        const across = right ? under.left >= 0 : under.right < turns.leafCount;
        const fall: Fall = ahead ? `air-${f.from}-${leaf.corner}` : across ? 'both' : f.from;
        turn(flap, f, h, true, right ? 2000 + index : 3000 - index, fall);
        lies(leaf.index, right ? -1 : 1, right ? 2000 + index : 3000 - index);
        next.add(flap);
      }
    }

    const turned = under.left >= 0 ? options.faces(under.left) : undefined;
    const leftPage =
      turned && !(lone && (options.verso?.() ?? 0) <= 0)
        ? options.page(lone ? turned.front : turned.back)
        : undefined;
    const rightPage =
      under.right < turns.leafCount ? options.page(options.faces(under.right).front) : undefined;
    if (leftPage) {
      rest(leftPage, 'left', lone ? (options.hard?.(under.left) ? 'board' : 'paper') : undefined);
      board(
        leftPage,
        frontCover ?? (under.left === last ? backCover : undefined),
        !lone && (under.left === 0 || under.left === last),
      );
      const above = folds[0];
      if (above?.from === 'left') shadeBeneath(leftPage, { x: -1, y: 0 }, above);
      next.add(leftPage);
    }
    if (rightPage) {
      rest(rightPage, 'right');
      board(
        rightPage,
        backCover ?? (under.right === 0 ? frontCover : undefined),
        under.right === 0 || under.right === last,
      );
      const above = folds.at(-1);
      if (above?.from === 'right') shadeBeneath(rightPage, { x: 0, y: 0 }, above);
      next.add(rightPage);
    }

    for (const page of drawn) {
      if (!next.has(page)) reset(page);
    }
    drawn = next;

    const shut =
      leftPage && !lone
        ? !rightPage && under.left === last && !!backCover
        : !!rightPage && (under.right === 0 ? !!frontCover : rightPage === backCover);
    const aloft = Number.isFinite(over);
    const svg = ribbon ? lay(ribbon, h, aloft ? over * 2 - 1 : 8000, shut && !aloft) : undefined;
    unlay(new Set(svg ? [svg] : []));
  }

  function clear() {
    for (const page of drawn) reset(page);
    drawn = new Set();
    for (const spare of standIns.values()) show(spare);
    standIns.clear();
    unlay(new Set());
  }

  return { draw, clear };
}

function curl(progress: number) {
  return Math.sqrt(Math.max(0, Math.sin(Math.PI * progress)));
}

const SLANT = 0.45;
const SHADOW = { shift: [0.002, 0.003] as const, spread: 0.002, thrown: 5 };
const SHEEN = 0.3;
const CORNERS = { turn: 0.02, run: 0.12 };
const CROSSING = { clear: 0.09, over: 1.6, shift: [0.004, 0.0055] as const, spread: 0.002 };

function crossingsOf(laid: Laid, out: number[]) {
  out.length = 0;
  const { places, runs } = laid;
  const x = (place: number) => places[place * PLACE + 4]!;
  const y = (place: number) => places[place * PLACE + 5]!;
  const along = (place: number) => places[place * PLACE + 6]!;
  for (let over = 0; over * 2 < runs.length; over++) {
    for (let b = runs[over * 2]!; b + 2 <= runs[over * 2 + 1]!; b += 2) {
      const bx = x(b);
      const by = y(b);
      const vx = x(b + 2) - bx;
      const vy = y(b + 2) - by;
      for (let under = 0; under <= over; under++) {
        for (let a = runs[under * 2]!; a + 2 <= runs[under * 2 + 1]!; a += 2) {
          if (along(b) - along(a) < CROSSING.clear) break;
          const ax = x(a);
          const ay = y(a);
          const ux = x(a + 2) - ax;
          const uy = y(a + 2) - ay;
          const cross = ux * vy - uy * vx;
          if (Math.abs(cross) < 1e-18) continue;
          const s = ((bx - ax) * vy - (by - ay) * vx) / cross;
          const t = ((bx - ax) * uy - (by - ay) * ux) / cross;
          if (s < 0 || s >= 1 || t < 0 || t >= 1) continue;
          out.push(a + 1, b + 1);
        }
      }
    }
  }
  return out;
}

function runOf(laid: Laid, place: number): [number, number] {
  const { runs } = laid;
  for (let run = 0; run * 2 < runs.length; run++) {
    if (place >= runs[run * 2]! && place <= runs[run * 2 + 1]!)
      return [runs[run * 2]!, runs[run * 2 + 1]!];
  }
  return [place, place];
}

const at = (x: number, y: number) => `${(x * 100).toFixed(2)} ${(y * 100).toFixed(2)}`;

function stretch(
  laid: Laid,
  first: number,
  last: number,
  kind: 'cloth' | 'sheen' | 'shadow',
  all = false,
) {
  const { places } = laid;
  let left = '';
  let right = '';
  let kept = first;
  for (let place = first; place <= last; place++) {
    const here = place * PLACE;
    if (!all && place > first && place < last) {
      const before = kept * PLACE;
      const after = here + PLACE;
      const ax = places[here + 4]! - places[before + 4]!;
      const ay = places[here + 5]! - places[before + 5]!;
      const bx = places[after + 4]! - places[here + 4]!;
      const by = places[after + 5]! - places[here + 5]!;
      const turn = Math.abs(Math.atan2(ax * by - ay * bx, ax * bx + ay * by));
      const same =
        Math.abs(places[here + 7]! - places[before + 7]!) < 0.05 &&
        Math.abs(places[here + 8]! - places[before + 8]!) < 0.05;
      if (turn < CORNERS.turn && same && places[here + 6]! - places[before + 6]! < CORNERS.run)
        continue;
    }
    kept = place;
    let lx = places[here]!;
    let ly = places[here + 1]!;
    let rx = places[here + 2]!;
    let ry = places[here + 3]!;
    const cx = places[here + 4]!;
    const cy = places[here + 5]!;
    if (kind === 'sheen') {
      lx = cx + (lx - cx) * SHEEN;
      ly = cy + (ly - cy) * SHEEN;
      rx = cx + (rx - cx) * SHEEN;
      ry = cy + (ry - cy) * SHEEN;
    } else if (kind === 'shadow') {
      const lift = places[here + 8]!;
      const wider = 1 + (SHADOW.spread * (1 + lift)) / (laid.width / 2);
      const sx = SHADOW.shift[0] * (1 + SHADOW.thrown * lift);
      const sy = SHADOW.shift[1] * (1 + SHADOW.thrown * lift);
      lx = cx + (lx - cx) * wider + sx;
      ly = cy + (ly - cy) * wider + sy;
      rx = cx + (rx - cx) * wider + sx;
      ry = cy + (ry - cy) * wider + sy;
    }
    left += `${left ? 'L' : 'M'}${at(lx, ly)}`;
    right = `L${at(rx, ry)}${right}`;
  }
  return `${left}${right}Z`;
}

function shade(laid: Laid, under: number, over: number, width: number) {
  const { places } = laid;
  const reach = Math.max(
    2,
    Math.round((CROSSING.over * width) / Math.max(1e-6, spacing(laid, over))),
  );
  const corners = (place: number, spread: number, shift: readonly [number, number]) => {
    const [first, last] = runOf(laid, place);
    const from = Math.max(first, place - reach) * PLACE;
    const to = Math.min(last, place + reach) * PLACE;
    const shape: number[] = [];
    for (const [here, side] of [
      [from, 0],
      [to, 0],
      [to, 2],
      [from, 2],
    ] as const) {
      const other = side === 0 ? 2 : 0;
      const wide =
        Math.hypot(
          places[here + side]! - places[here + other]!,
          places[here + side + 1]! - places[here + other + 1]!,
        ) || 1;
      shape.push(
        places[here + side]! +
          ((places[here + side]! - places[here + other]!) * spread) / wide +
          shift[0],
        places[here + side + 1]! +
          ((places[here + side + 1]! - places[here + other + 1]!) * spread) / wide +
          shift[1],
      );
    }
    return shape;
  };
  let shadow = corners(over, CROSSING.spread, CROSSING.shift);
  const cloth = corners(under, 0, [0, 0]);
  let area = 0;
  for (let index = 0; index < 4; index++) {
    const next = (index + 1) % 4;
    area += cloth[index * 2]! * cloth[next * 2 + 1]! - cloth[next * 2]! * cloth[index * 2 + 1]!;
  }
  const way = area < 0 ? -1 : 1;
  for (let edge = 0; edge < 4 && shadow.length >= 6; edge++) {
    const ax = cloth[edge * 2]!;
    const ay = cloth[edge * 2 + 1]!;
    const ex = cloth[((edge + 1) % 4) * 2]! - ax;
    const ey = cloth[((edge + 1) % 4) * 2 + 1]! - ay;
    const side = (x: number, y: number) => (ex * (y - ay) - ey * (x - ax)) * way;
    const kept: number[] = [];
    for (let index = 0; index < shadow.length; index += 2) {
      const next = (index + 2) % shadow.length;
      const x = shadow[index]!;
      const y = shadow[index + 1]!;
      const nx = shadow[next]!;
      const ny = shadow[next + 1]!;
      const here = side(x, y);
      const there = side(nx, ny);
      if (here >= 0) kept.push(x, y);
      if (here >= 0 !== there >= 0) {
        const share = here / (here - there);
        kept.push(x + (nx - x) * share, y + (ny - y) * share);
      }
    }
    shadow = kept;
  }
  if (shadow.length < 6) return '';
  let path = '';
  for (let index = 0; index < shadow.length; index += 2)
    path += `${index ? 'L' : 'M'}${at(shadow[index]!, shadow[index + 1]!)}`;
  return `${path}Z`;
}

function spacing(laid: Laid, place: number) {
  const [first, last] = runOf(laid, place);
  const { places } = laid;
  const a = Math.max(first, place - 1) * PLACE;
  const b = Math.min(last, place + 1) * PLACE;
  return Math.abs(places[b + 6]! - places[a + 6]!) / Math.max(1, (b - a) / PLACE);
}

function outline(laid: Laid, kind: string, crossed: readonly number[]) {
  const { runs } = laid;
  let path = '';
  if (kind === 'cloth' || kind === 'shadow' || kind === 'sheen') {
    for (let run = 0; run * 2 < runs.length; run++) {
      if (runs[run * 2 + 1]! > runs[run * 2]!)
        path += stretch(laid, runs[run * 2]!, runs[run * 2 + 1]!, kind);
    }
    return path;
  }
  const width = laid.width;
  for (let index = 0; index < crossed.length; index += 2) {
    const under = crossed[index]!;
    const over = crossed[index + 1]!;
    if (kind === 'under') {
      path += shade(laid, under, over, width);
      continue;
    }
    const [first, last] = runOf(laid, over);
    const reach = Math.max(
      2,
      Math.round((CROSSING.over * width) / Math.max(1e-6, spacing(laid, over))),
    );
    const from = Math.max(first, over - reach);
    const to = Math.min(last, over + reach);
    if (to > from) path += stretch(laid, from, to, kind === 'over-sheen' ? 'sheen' : 'cloth', true);
  }
  return path;
}

function cqw(value: number) {
  return `${(value * 100).toFixed(3)}cqw`;
}

function rad(value: number) {
  return `${value.toFixed(5)}rad`;
}

type Fall = 'both' | 'left' | 'right' | `air-${'left' | 'right'}-${'top' | 'bottom'}`;

type Renderer = ReturnType<typeof createRenderer>;

export { createRenderer };
export type { PageElements, Renderer, RendererOptions };
