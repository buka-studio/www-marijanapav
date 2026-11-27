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

/**
 * Draws turning leaves onto page elements. Each page is three nested elements: a page-sized slot, a clip turned to
 * lie along a crease, and the content. While a leaf is in the air only `transform`, `opacity` and `z-index` change,
 * so the browser never lays out or repaints a page. Lengths are in `cqw` (the slot is the container, 100cqw is one
 * page width), so nothing is measured or redone on resize. With one column a leaf's far side is its one page seen
 * from behind: at rest on the left, the page itself turned over; in the air, a copy on a spare, made as the leaf
 * lifts and gone when it lands.
 */

interface PageElements {
  /** The page-sized box. Carries `data-turning`, `data-under`, `data-side` and `data-verso`. */
  slot: HTMLElement;
  /** The box that cuts the page along the crease. */
  clip: HTMLElement;
  content: HTMLElement;
  /** A strip of shading laid along the crease. */
  shade: HTMLElement;
  /** Where the page's shadow may fall: a window the size of the spread. */
  cast: HTMLElement;
  /** The shadow a folded-over page casts on what lies beneath it. */
  shadow: HTMLElement;
}

interface RendererOptions {
  /** The elements of page `index`, or undefined when it isn't mounted. */
  page: (index: number) => PageElements | undefined;
  /** Which pages are on a leaf's two sides. -1 for a blank side. */
  faces: (leaf: number) => { front: number; back: number };
  /** Pages side by side. With one, a leaf's far side is its page seen from behind. */
  columns?: () => Columns;
  /** How much of the leaves turned from a single page shows to its left. With none, nothing is laid there. */
  verso?: () => number;
  /** Spare pages with nothing on them, to stand in for blank sides. */
  blanks?: () => readonly PageElements[];
  /** Whether a leaf is stiff, like a cover: it swings on the spine and doesn't fold. */
  hard?: (leaf: number) => boolean;
  strip?: () => SVGSVGElement | undefined;
}

/** How much taller the shading strip is drawn than it is laid out. */
const SHADE_STRETCH = 120;
/** How much larger the cast shadow is drawn than it is laid out. */
const CAST_STRETCH = 10;
/** How far the eye is from a swinging cover, in page widths. */
const DISTANCE = 4.5;
/** Turns a page over where it lies, to be seen from behind. */
const OVER = 'translate(100cqw,0) scaleX(-1)';

function createRenderer(options: RendererOptions) {
  let drawn = new Set<PageElements>();
  /** Which spare page stands in for which leaf's blank side. */
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

  /** Lays a page at rest. `verso`: seen from behind as its leaf's far side, through paper or not at all (`board`). */
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

  /** The boards that lie under pages, and the colour last read off each. */
  const boards = new Map<PageElements, string>();

  /**
   * Marks a page as on a board, whose rim shows round it. `cover` is the board's outside, which gives its colour,
   * finish and sheen. With `side` the page is of the cover's own leaf; a stiff one is the board's face, and the rim
   * takes its colour.
   */
  function board(page: PageElements, cover: PageElements | undefined, side = false) {
    if (!cover) {
      unboard(page);
      return;
    }
    // Read once for as long as it lies there: nothing here is measured while a leaf is in the air.
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
    // A cover is one or the other: the stronger of the two is what it is covered in.
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

  /** The pages whose rim is in the air with them. */
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
    // A folding page leaves its board behind; a swinging one is on its board and takes it along.
    if (mode === '') {
      unboard(page);
      unswing(page);
    }
    // Doubled, which leaves room between any two leaves for a ribbon.
    page.slot.style.zIndex = String(z * 2);
  }

  /** The strips that are showing, and what was last written to each. */
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
  /** Where the strip crosses itself: the place underneath, then the one on top, for each crossing. */
  const crossed: number[] = [];

  /** Draws a strip as paths, at `z` among the leaves. `covered`: a shut board's rim hides it as far as it overhangs. */
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

  /** Lays the shading strip along a crease. `at` is in the page's own coordinates. */
  function shade(page: PageElements, at: Point, angle: number, strength: number) {
    page.shade.style.transform = `translate(${cqw(at.x)},${cqw(at.y)}) rotate(${rad(angle)}) scaleY(${SHADE_STRETCH})`;
    page.shade.style.opacity = strength.toFixed(3);
  }

  /** The shadow of the crease of the leaf lying on `page`, if there is one. */
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

  /** Draws one side of a folding leaf, flat part or flap. `fall`: where the flap's shadow may fall (see `Fall`). */
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

    // The clip's left edge lies along the crease and it opens onto the flat side.
    page.clip.style.transform = `translate(${cqw(f.mid.x)},${cqw(f.mid.y - h / 2)}) rotate(${rad(f.normal)})`;
    // The content undoes the clip's turn, then takes its own place.
    const dx = at.x - f.mid.x;
    const dy = at.y - f.mid.y;
    const placed = `translate(${cqw(cos * dx + sin * dy)},${cqw(-sin * dx + cos * dy + h / 2)}) rotate(${rad(rotation - f.normal)})`;
    page.content.style.transform = placed;

    if (flap) {
      // The crease, seen from the folded page's own coordinates.
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
      // The window undoes the clip's turn to lie square on the spread; its shadow then takes the flap's place.
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

  /** One side of a stiff leaf, swung `t` of the way over the spine. `lone`: nothing lies on the side it is over. */
  function swing(page: PageElements, t: number, back: boolean, z: number, lone: boolean) {
    lift(page, 'hard', z);
    // The front swings up from the right, the back comes down onto the left.
    const angle = back ? (1 - t) * 180 : -t * 180;
    page.clip.style.transform = '';
    page.content.style.transform = `translate(0,50cqh) perspective(${cqw(DISTANCE)}) rotateY(${angle.toFixed(3)}deg) translate(${back ? '-100cqw' : '0'},-50cqh)`;
    // It darkens as it turns away from the light.
    const dark = (0.22 * Math.sin(Math.PI * t)).toFixed(3);
    page.shade.style.transform = '';
    page.shade.style.opacity = dark;
    page.cast.style.opacity = '0';
    // The board's rim swings as the board does: from lying right, whichever side of it shows.
    swung.add(page);
    page.slot.style.setProperty(
      '--book-swing',
      `perspective(${cqw(DISTANCE)}) rotateY(${(-t * 180).toFixed(3)}deg)`,
    );
    page.slot.style.setProperty('--book-swing-shade', dark);
    // Over a pile, the board under that pile has the shadow already, and two would show as one darker.
    page.slot.style.setProperty('--book-swing-cast', lone ? '1' : '0');
  }

  /** A spare page to show as a blank side of `leaf`, kept for as long as the leaf is in the air. */
  function standIn(leaf: number): PageElements | undefined {
    const held = standIns.get(leaf);
    if (held) return held;
    const taken = new Set(standIns.values());
    const spare = options.blanks?.().find((blank) => !taken.has(blank));
    if (spare) standIns.set(leaf, spare);
    return spare;
  }

  /** The copies of pages lying on spares, each with the page it is of. No copy for a page that doesn't show through. */
  const copies = new Map<PageElements, { of: HTMLElement; el: HTMLElement | undefined }>();

  /** Shows `page` from behind on a spare, or clears it. Copied once, as its leaf lifts, not while it is in the air. */
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

  /** Draws the book as `turns` has it now, and its ribbon. `h` is page height over page width. */
  function draw(turns: Turns, h: number, ribbon?: Strip) {
    const next = new Set<PageElements>();
    /** One page to a leaf: the far side of each is that page from behind. */
    const lone = options.columns?.() === 1;
    /** The lowest of the leaves in the air that lie over the ribbon. */
    let over = Infinity;
    const lies = (leaf: number, side: -1 | 1, z: number) => {
      if (ribbon && overRibbon(ribbon, leaf, side)) over = Math.min(over, z);
    };
    const { active, under } = turns;
    // A stiff leaf has no crease, so it has no fold.
    const folds = active.map((leaf) =>
      options.hard?.(leaf.index) ? undefined : fold(leaf.point, leaf.corner, h, leaf.from),
    );

    for (const [leaf, spare] of standIns) {
      if (active.some((item) => item.index === leaf)) continue;
      show(spare);
      standIns.delete(leaf);
    }

    // The covers, when they are boards, lie at the bottom of the piles.
    const last = turns.leafCount - 1;
    const frontCover =
      last >= 0 && options.hard?.(0) ? options.page(options.faces(0).front) : undefined;
    // The back board's outside is the back of the last leaf: or its front, where a leaf has one page.
    const end = last >= 0 ? options.faces(last) : undefined;
    const backCover =
      end && options.hard?.(last) ? options.page(end.back >= 0 ? end.back : end.front) : undefined;

    for (let index = 0; index < active.length; index++) {
      const leaf = active[index]!;
      const f = folds[index];
      const faces = options.faces(leaf.index);
      const front = options.page(faces.front);
      const back = faces.back >= 0 ? options.page(faces.back) : standIn(leaf.index);
      // A board lets nothing through: its far side stays blank.
      if (back && faces.back < 0) show(back, lone && f ? front : undefined);

      if (!f) {
        // Only the side facing the reader shows. Until it is half way over it
        // lies beneath the leaves it has still to follow; past that, on them.
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
          // A cover is a board, in the air as much as at rest: either side of it has the rim round it.
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

      // In the right-hand pile the lower leaf lies on top; in the left-hand
      // pile, and among pages folded over from the right, the higher one does.
      const right = f.from === 'right';
      const flat = right ? front : back;
      const flap = right ? back : front;
      // The leaf that went over just ahead of this one, the same way.
      const beside = folds[right ? index - 1 : index + 1];
      const ahead = beside?.from === f.from ? beside : undefined;
      if (flat) {
        turn(flat, f, h, false, right ? 1000 - index : 1000 + index);
        lies(leaf.index, right ? 1 : -1, right ? 1000 - index : 1000 + index);
        // That leaf lies on this one, and casts its shadow along its own crease.
        shadeBeneath(flat, f.flat, ahead);
        next.add(flat);
      }
      if (flap) {
        // Its shadow falls on its own leaf, and across the spine only if pages lie there; or on a leaf folded over
        // ahead, in the air past the spread, on the side it goes to and the end its corner was lifted to.
        const across = right ? under.left >= 0 : under.right < turns.leafCount;
        const fall: Fall = ahead ? `air-${f.from}-${leaf.corner}` : across ? 'both' : f.from;
        turn(flap, f, h, true, right ? 2000 + index : 3000 - index, fall);
        lies(leaf.index, right ? -1 : 1, right ? 2000 + index : 3000 - index);
        next.add(flap);
      }
    }

    // What lies on top of the left-hand pile is the back of a leaf: with one page to a leaf, its page from behind.
    const turned = under.left >= 0 ? options.faces(under.left) : undefined;
    const leftPage =
      turned && !(lone && (options.verso?.() ?? 0) <= 0)
        ? options.page(lone ? turned.front : turned.back)
        : undefined;
    const rightPage =
      under.right < turns.leafCount ? options.page(options.faces(under.right).front) : undefined;
    if (leftPage) {
      rest(leftPage, 'left', lone ? (options.hard?.(under.left) ? 'board' : 'paper') : undefined);
      // The front board lies at the bottom of this pile. With the whole book turned, the back one is its top.
      // A page seen from behind is no face of a board, even when it is the board's own: that is its inside.
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

    // The ribbon goes just under the lowest leaf lying over it; with none in the air, over the pages at rest, where
    // only its tail shows below them. A shut book's tail comes out from under its top board's rim. One page to a
    // leaf, the back board lies on the right like every other page.
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

/** Shading is strongest mid-turn and gone when the leaf lies flat. */
function curl(progress: number) {
  return Math.sqrt(Math.max(0, Math.sin(Math.PI * progress)));
}

/** How far along a ribbon's end one edge is cut longer than the other, in ribbon widths. */
const SLANT = 0.45;
/** How a strip throws its shadow, in page widths; `thrown` is how many times further where a hand has lifted it. */
const SHADOW = { shift: [0.002, 0.003] as const, spread: 0.002, thrown: 5 };
/** How much of a strip's width the light down its face takes up. */
const SHEEN = 0.3;
/** How far a strip may turn (radians) or run (page widths) between two corners of its drawn outline. */
const CORNERS = { turn: 0.02, run: 0.12 };
/**
 * A strip crossing itself: how far back along it the part underneath must be to count (nearer, the two lie as one);
 * how much of the part on top is redrawn over it each side, in strip widths; that part's shadow throw and spread.
 */
const CROSSING = { clear: 0.09, over: 1.6, shift: [0.004, 0.0055] as const, spread: 0.002 };

/** Writes each self-crossing of a laid strip to `out`: the place underneath, then the one on top (later along it). */
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

/** The run of a laid strip that place `place` is in: its first place and its last. */
function runOf(laid: Laid, place: number): [number, number] {
  const { runs } = laid;
  for (let run = 0; run * 2 < runs.length; run++) {
    if (place >= runs[run * 2]! && place <= runs[run * 2 + 1]!)
      return [runs[run * 2]!, runs[run * 2 + 1]!];
  }
  return [place, place];
}

/** A point as an SVG path writes one, with 100 units to the page width. */
const at = (x: number, y: number) => `${(x * 100).toFixed(2)} ${(y * 100).toFixed(2)}`;

/**
 * A stretch of a laid strip outlined as one closed shape, down one edge and back up the other: the `cloth`, the
 * `sheen` down its face, or its `shadow`. Without `all`, places are skipped where it runs straight.
 */
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
    // About its middle, which an edge drawn in round a sharp turn is nearer to than the other.
    const cx = places[here + 4]!;
    const cy = places[here + 5]!;
    if (kind === 'sheen') {
      lx = cx + (lx - cx) * SHEEN;
      ly = cy + (ly - cy) * SHEEN;
      rx = cx + (rx - cx) * SHEEN;
      ry = cy + (ry - cy) * SHEEN;
    } else if (kind === 'shadow') {
      // It is the strip's own shape, the cut of its end included, a little wider and moved off.
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

/**
 * The shadow a strip throws on itself at a crossing: the part on top's four corners, moved off as its shadow falls
 * and cut to the part underneath. So short a stretch is straight enough to take as four-cornered.
 */
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
  // Which way round the cloth's corners go, so that inside is always to one side of each edge.
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

/** About how far apart the places of a laid strip are, near `place`. */
function spacing(laid: Laid, place: number) {
  const [first, last] = runOf(laid, place);
  const { places } = laid;
  const a = Math.max(first, place - 1) * PLACE;
  const b = Math.min(last, place + 1) * PLACE;
  return Math.abs(places[b + 6]! - places[a + 6]!) / Math.max(1, (b - a) / PLACE);
}

/**
 * One part of a laid strip as an SVG path, 100 units to the page width: `cloth`, `shadow` or `sheen`, each one flat
 * shape; at crossings, `under` is the top part's shadow on the part beneath, and `over` that top part drawn again.
 */
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

/** Where a shadow may fall: both sides of the spread, one, or leaves in the air (the leaf's lifted side and corner). */
type Fall = 'both' | 'left' | 'right' | `air-${'left' | 'right'}-${'top' | 'bottom'}`;

type Renderer = ReturnType<typeof createRenderer>;

export { createRenderer };
export type { PageElements, Renderer, RendererOptions };
