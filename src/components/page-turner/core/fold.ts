/**
 * Flat-fold geometry for one leaf (a sheet with a page on each side).
 * Units: a page is 1 wide and `h` tall; the origin is the top of the spine, x grows across the right-hand page and
 * y downward. A leaf lying on the right covers [0, 1] × [0, h]; fully turned, [-1, 0] × [0, h].
 * A turn is given by where one outer corner is. The crease is the perpendicular bisector between that corner's
 * resting place and its current place: paper on the resting side of it has folded over, the rest lies flat.
 * Lifted from the right, the front lies flat and the back folds over; lifted from the left is the mirror image.
 */

type Corner = 'top' | 'bottom';
type Side = 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface Fold {
  /** The side the leaf lifted from. */
  from: Side;
  /** Where the lifted corner is, within the paper's limits. */
  corner: Point;
  /** A point on the crease, halfway between the corner's home and the corner. */
  mid: Point;
  /** Direction of the crease's normal, in radians, pointing into the flat side. */
  normal: number;
  /** Where the top-left of the face still lying flat is. */
  flat: Point;
  /** Where the top-left of the folded-over face lands. */
  flap: Point;
  /** Rotation of the folded-over face, in radians. */
  flapRotation: number;
  /** How far the leaf has turned: 0 lying right, 1 lying left. */
  progress: number;
}

const EPSILON = 1e-4;

/** Where a leaf's outer corner rests on the side it lifts from. */
function home(corner: Corner, h: number, from: Side = 'right'): Point {
  return { x: from === 'right' ? 1 : -1, y: corner === 'bottom' ? h : 0 };
}

/** Held along the spine, a corner stays within one page width of its near end and one diagonal of its far end. */
function constrain(point: Point, corner: Corner, h: number): Point {
  const near = corner === 'bottom' ? h : 0;
  const far = corner === 'bottom' ? 0 : h;
  let { x, y } = point;

  let dy = y - near;
  let distance = Math.hypot(x, dy);
  if (distance > 1) {
    x /= distance;
    y = near + dy / distance;
  }

  const diagonal = Math.hypot(1, h);
  dy = y - far;
  distance = Math.hypot(x, dy);
  if (distance > diagonal) {
    x = (x / distance) * diagonal;
    y = far + (dy / distance) * diagonal;
  }

  return { x, y };
}

/** The fold that puts the `corner` of a leaf lifted from `from` at `point`. */
function fold(point: Point, corner: Corner, h: number, from: Side = 'right'): Fold {
  const at = constrain(point, corner, h);
  // Worked out as if the leaf lifted from the right, then mirrored if it didn't.
  const sign = from === 'right' ? 1 : -1;
  const rest = corner === 'bottom' ? h : 0;
  const dx = at.x * sign - 1;
  const dy = at.y - rest;
  const distance = Math.hypot(dx, dy);

  // Not lifted yet: the crease sits on the outer edge and nothing has folded.
  const nx = distance < EPSILON ? -1 : dx / distance;
  const ny = distance < EPSILON ? 0 : dy / distance;
  const mx = 1 + dx / 2;
  const my = rest + dy / 2;

  // The folded face's top-left is the mirror image of the leaf's top-right.
  const side = nx * (1 - mx) + ny * (0 - my);
  const turn = 2 * Math.atan2(ny, nx);
  const landed = { x: 1 - 2 * nx * side, y: -2 * ny * side };

  return {
    from,
    corner: at,
    mid: { x: mx * sign, y: my },
    normal: Math.atan2(ny, nx * sign),
    flat: { x: from === 'right' ? 0 : -1, y: 0 },
    flap:
      from === 'right' ? landed : { x: -landed.x - Math.cos(turn), y: landed.y + Math.sin(turn) },
    flapRotation: wrap(turn * sign),
    progress: progressOf(at),
  };
}

function progressOf(point: Point): number {
  return Math.min(1, Math.max(0, (1 - point.x) / 2));
}

/**
 * The path of a corner nobody holds: it lifts off the page, arcs over the spine and lands flat. `lift` is how high
 * the arc rises, in page widths, and sets how diagonal the curl looks. The path is the same from either side.
 */
function cornerPath(progress: number, corner: Corner, h: number, lift = 0.22): Point {
  const rise = lift * Math.sin(Math.PI * progress);
  return {
    x: 1 - 2 * progress,
    y: corner === 'bottom' ? h - rise : rise,
  };
}

/** Where a point of the folded-over face, in that page's own coordinates, lands. */
function placeFlap(f: Fold, u: number, v: number): Point {
  const cos = Math.cos(f.flapRotation);
  const sin = Math.sin(f.flapRotation);
  return { x: f.flap.x + cos * u - sin * v, y: f.flap.y + sin * u + cos * v };
}

function wrap(angle: number): number {
  const turn = 2 * Math.PI;
  return angle - turn * Math.round(angle / turn);
}

export { constrain, cornerPath, fold, home, placeFlap, progressOf };
export type { Corner, Fold, Point, Side };
