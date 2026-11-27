import { fold, type Corner, type Fold, type Point, type Side } from './fold';

/**
 * How a leaf bends as it turns. A curl rounds the fold's sharp crease: the paper leaves the page beneath along a
 * line, rolls over a cylinder lying along it and comes back level on top, landing where the sharp fold would have
 * put it, only higher. The roll uses no more paper than has folded over and leaves the spine flat, so it is tight
 * just after lifting, widest mid-turn and gone on landing. Heights are in page widths and grow towards the eye.
 */

interface Curl {
  fold: Fold;
  /** The radius of the roll. 0 is a sharp crease. */
  radius: number;
  /** A point on the line along which the paper leaves the page beneath. */
  line: Point;
  /** Unit vector across that line, from the paper lying flat to the paper in the air. */
  across: Point;
}

interface Point3 extends Point {
  z: number;
}

interface CurlOptions {
  /** How round the bend is: 0 is a sharp crease, 1 as round as the paper allows. */
  roundness?: number;
  /** The largest radius the roll may have. */
  limit?: number;
  /** Eye height above the middle of the spine, so the corner is seen where the turn has it. Omit for a distant eye. */
  eye?: number;
}

/** Eye height above the middle of the spine, in page widths. */
const EYE = 4.5;

const QUARTER = Math.PI / 2;

/** The curl that puts the `corner` of a leaf lifted from `from` at `point`. */
function curl(
  point: Point,
  corner: Corner,
  h: number,
  from: Side = 'right',
  { roundness = 0.7, limit = 0.3, eye = Infinity }: CurlOptions = {},
): Curl {
  let bent = round(fold(point, corner, h, from), h, roundness, limit);
  if (!Number.isFinite(eye)) return bent;
  // On top of the roll the corner is nearer the eye and looks further out than it is: bring it in until it looks right.
  for (let pass = 0; pass < 2; pass++) {
    const scale = (eye - 2 * bent.radius) / eye;
    const seen = { x: point.x * scale, y: h / 2 + (point.y - h / 2) * scale };
    bent = round(fold(seen, corner, h, from), h, roundness, limit);
  }
  return bent;
}

function round(f: Fold, h: number, roundness: number, limit: number): Curl {
  // The crease's normal points into the paper that still lies flat.
  const flat = { x: Math.cos(f.normal), y: Math.sin(f.normal) };
  // Paper folded over, measured across the crease.
  const folded = Math.hypot(f.corner.x - f.mid.x, f.corner.y - f.mid.y);
  // Flat paper between the crease and the nearer end of the spine.
  const top = -f.mid.x * flat.x - f.mid.y * flat.y;
  const held = Math.max(0, Math.min(top, top + h * flat.y));
  // The roll takes a quarter turn of paper from each side of the crease.
  const radius = Math.max(0, roundness) * Math.min(limit, folded / QUARTER, held / QUARTER);
  return {
    fold: f,
    radius,
    line: { x: f.mid.x + flat.x * QUARTER * radius, y: f.mid.y + flat.y * QUARTER * radius },
    across: { x: -flat.x, y: -flat.y },
  };
}

/** How far past the line where the paper lifts a point of the leaf is; negative for paper lying flat. */
function along(c: Curl, at: Point): number {
  return (at.x - c.line.x) * c.across.x + (at.y - c.line.y) * c.across.y;
}

/** Where a point of the leaf, given by where it lies at rest, is in the air. */
function lift(c: Curl, at: Point): Point3 {
  const d = along(c, at);
  if (d <= 0) return { x: at.x, y: at.y, z: 0 };
  const arc = Math.PI * c.radius;
  // On the roll the paper goes around; past it, it runs back level on top.
  const reach = d < arc ? c.radius * Math.sin(d / c.radius) : arc - d;
  const z = d < arc ? c.radius * (1 - Math.cos(d / c.radius)) : 2 * c.radius;
  return { x: at.x + (reach - d) * c.across.x, y: at.y + (reach - d) * c.across.y, z };
}

/** Where a point in the air is seen on the page, by an eye above the middle of the spine. */
function seen(at: Point3, h: number, eye: number): Point {
  const scale = eye / (eye - at.z);
  return { x: at.x * scale, y: h / 2 + (at.y - h / 2) * scale };
}

export { along, curl, EYE, lift, seen };
export type { Curl, CurlOptions, Point3 };
