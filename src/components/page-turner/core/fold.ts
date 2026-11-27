type Corner = 'top' | 'bottom';
type Side = 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface Fold {
  from: Side;
  corner: Point;
  mid: Point;
  normal: number;
  flat: Point;
  flap: Point;
  flapRotation: number;
  progress: number;
}

const EPSILON = 1e-4;

function home(corner: Corner, h: number, from: Side = 'right'): Point {
  return { x: from === 'right' ? 1 : -1, y: corner === 'bottom' ? h : 0 };
}

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

function fold(point: Point, corner: Corner, h: number, from: Side = 'right'): Fold {
  const at = constrain(point, corner, h);
  const sign = from === 'right' ? 1 : -1;
  const rest = corner === 'bottom' ? h : 0;
  const dx = at.x * sign - 1;
  const dy = at.y - rest;
  const distance = Math.hypot(dx, dy);

  const nx = distance < EPSILON ? -1 : dx / distance;
  const ny = distance < EPSILON ? 0 : dy / distance;
  const mx = 1 + dx / 2;
  const my = rest + dy / 2;

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

function cornerPath(progress: number, corner: Corner, h: number, lift = 0.22): Point {
  const rise = lift * Math.sin(Math.PI * progress);
  return {
    x: 1 - 2 * progress,
    y: corner === 'bottom' ? h - rise : rise,
  };
}

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
