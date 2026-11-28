import { fold, type Corner, type Fold, type Point, type Side } from './fold';

interface Curl {
  fold: Fold;
  radius: number;
  line: Point;
  across: Point;
}

interface Point3 extends Point {
  z: number;
}

interface CurlOptions {
  roundness?: number;
  limit?: number;
  eye?: number;
}

const EYE = 4.5;

const QUARTER = Math.PI / 2;

function curl(
  point: Point,
  corner: Corner,
  h: number,
  from: Side = 'right',
  { roundness = 0.7, limit = 0.3, eye = Infinity }: CurlOptions = {},
): Curl {
  let bent = round(fold(point, corner, h, from), h, roundness, limit);
  if (!Number.isFinite(eye)) return bent;
  for (let pass = 0; pass < 2; pass++) {
    const scale = (eye - 2 * bent.radius) / eye;
    const seen = { x: point.x * scale, y: h / 2 + (point.y - h / 2) * scale };
    bent = round(fold(seen, corner, h, from), h, roundness, limit);
  }
  return bent;
}

function round(f: Fold, h: number, roundness: number, limit: number): Curl {
  const flat = { x: Math.cos(f.normal), y: Math.sin(f.normal) };
  const folded = Math.hypot(f.corner.x - f.mid.x, f.corner.y - f.mid.y);
  const top = -f.mid.x * flat.x - f.mid.y * flat.y;
  const held = Math.max(0, Math.min(top, top + h * flat.y));
  const radius = Math.max(0, roundness) * Math.min(limit, folded / QUARTER, held / QUARTER);
  return {
    fold: f,
    radius,
    line: { x: f.mid.x + flat.x * QUARTER * radius, y: f.mid.y + flat.y * QUARTER * radius },
    across: { x: -flat.x, y: -flat.y },
  };
}

function along(c: Curl, at: Point): number {
  return (at.x - c.line.x) * c.across.x + (at.y - c.line.y) * c.across.y;
}

function lift(c: Curl, at: Point): Point3 {
  const d = along(c, at);
  if (d <= 0) return { x: at.x, y: at.y, z: 0 };
  const arc = Math.PI * c.radius;
  const reach = d < arc ? c.radius * Math.sin(d / c.radius) : arc - d;
  const z = d < arc ? c.radius * (1 - Math.cos(d / c.radius)) : 2 * c.radius;
  return { x: at.x + (reach - d) * c.across.x, y: at.y + (reach - d) * c.across.y, z };
}

function seen(at: Point3, h: number, eye: number): Point {
  const scale = eye / (eye - at.z);
  return { x: at.x * scale, y: h / 2 + (at.y - h / 2) * scale };
}

export { along, curl, EYE, lift, seen };
export type { Curl, CurlOptions, Point3 };
