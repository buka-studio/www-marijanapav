import { along, lift, PLACE, type Curl, type Laid, type Point } from '../core';

const STRIDE = 6;

const STEPS = 12;

type Part = 'under' | 'over';

type Vec3 = readonly [number, number, number];

interface Mesh {
  data: Float32Array;
  count: number;
}

function createMesh(): Mesh {
  return { data: new Float32Array(STRIDE * 3 * 256), count: 0 };
}

function corner(mesh: Mesh, x: number, y: number, z: number, s: number, t: number, d: number) {
  let at = mesh.count * STRIDE;
  if (at + STRIDE > mesh.data.length) {
    const grown = new Float32Array(mesh.data.length * 2);
    grown.set(mesh.data);
    mesh.data = grown;
  }
  const { data } = mesh;
  data[at++] = x;
  data[at++] = y;
  data[at++] = z;
  data[at++] = s;
  data[at++] = t;
  data[at] = d;
  mesh.count++;
}

function sheet(mesh: Mesh, x: number, h: number) {
  mesh.count = 0;
  corner(mesh, x, 0, 0, 0, 0, 0);
  corner(mesh, x + 1, 0, 0, 1, 0, 0);
  corner(mesh, x + 1, h, 0, 1, 1, 0);
  corner(mesh, x, 0, 0, 0, 0, 0);
  corner(mesh, x + 1, h, 0, 1, 1, 0);
  corner(mesh, x, h, 0, 0, 1, 0);
}

function panel(
  mesh: Mesh,
  origin: Vec3,
  right: Vec3,
  [from, to]: readonly [number, number],
  [top, bottom]: readonly [number, number],
  h: number,
) {
  mesh.count = 0;
  const put = (a: number, v: number) =>
    corner(
      mesh,
      origin[0] + a * right[0],
      origin[1] + a * right[1] + v,
      origin[2] + a * right[2],
      a,
      v / h,
      0,
    );
  put(from, top);
  put(to, top);
  put(to, bottom);
  put(from, top);
  put(to, bottom);
  put(from, bottom);
}

function slab(
  mesh: Mesh,
  from: Vec3,
  to: Vec3,
  across: Vec3,
  [low, high]: readonly [number, number],
  [start, end]: readonly [number, number],
) {
  mesh.count = 0;
  const put = (at: Vec3, a: number, along: number) =>
    corner(mesh, at[0] + a * across[0], at[1] + a * across[1], at[2] + a * across[2], a, along, 0);
  put(from, low, start);
  put(from, high, start);
  put(to, high, end);
  put(from, low, start);
  put(to, high, end);
  put(to, low, end);
}

function swing(t: number): { run: Vec3; out: Vec3 } {
  const cos = Math.cos(Math.PI * t);
  const sin = Math.sin(Math.PI * t);
  return { run: [cos, 0, sin], out: [-sin, 0, cos] };
}

function cloth(
  mesh: Mesh,
  laid: Laid,
  run: number,
  {
    rise = 0,
    soft,
    softer = 0,
    shift = [0, 0],
    thrown = 0,
  }: {
    rise?: number;
    soft?: number;
    softer?: number;
    shift?: readonly [number, number];
    thrown?: number;
  } = {},
) {
  mesh.count = 0;
  const { places, runs } = laid;
  const first = runs[run * 2]!;
  const last = runs[run * 2 + 1]!;
  if (last <= first) return;
  const shadow = soft !== undefined;
  const edge = (place: number, corners: Float64Array, past = 0) => {
    const at = place * PLACE;
    let lx = places[at]!;
    let ly = places[at + 1]!;
    let rx = places[at + 2]!;
    let ry = places[at + 3]!;
    const cx = places[at + 4]!;
    const cy = places[at + 5]!;
    let along = places[at + 6]!;
    const lift = places[at + 8]!;
    let reach = laid.width / 2;
    if (shadow) {
      const more = soft! * (1 + softer * lift);
      const wider = 1 + more / reach;
      reach += more;
      let sx = shift[0] * (1 + thrown * lift);
      let sy = shift[1] * (1 + thrown * lift);
      if (past !== 0) {
        const near = (place - past) * PLACE;
        const tx = cx - places[near + 4]!;
        const ty = cy - places[near + 5]!;
        const length = Math.hypot(tx, ty) || 1;
        sx += (tx * more) / length;
        sy += (ty * more) / length;
        along += past * more;
      }
      lx = cx + (lx - cx) * wider + sx;
      ly = cy + (ly - cy) * wider + sy;
      rx = cx + (rx - cx) * wider + sx;
      ry = cy + (ry - cy) * wider + sy;
      corners[7] = 0.5 - Math.min(1, Math.hypot(lx - cx - sx, ly - cy - sy) / reach) / 2;
      corners[8] = 0.5 + Math.min(1, Math.hypot(rx - cx - sx, ry - cy - sy) / reach) / 2;
    } else {
      corners[7] = 0.5 - Math.min(1, Math.hypot(lx - cx, ly - cy) / reach) / 2;
      corners[8] = 0.5 + Math.min(1, Math.hypot(rx - cx, ry - cy) / reach) / 2;
    }
    corners[0] = lx;
    corners[1] = ly;
    corners[2] = rx;
    corners[3] = ry;
    corners[4] = shadow ? 0 : rise * lift;
    corners[5] = along;
    corners[6] = shadow ? lift : places[at + 7]!;
  };
  let before = edges[0];
  let here = edges[1];
  const from = shadow ? first - 1 : first;
  const to = shadow ? last + 1 : last;
  for (let step = from; step <= to; step++) {
    if (step < first) edge(first, here, -1);
    else if (step > last) edge(last, here, 1);
    else edge(step, here);
    if (step > from) {
      corner(mesh, before[0]!, before[1]!, before[4]!, before[7]!, before[5]!, before[6]!);
      corner(mesh, before[2]!, before[3]!, before[4]!, before[8]!, before[5]!, before[6]!);
      corner(mesh, here[2]!, here[3]!, here[4]!, here[8]!, here[5]!, here[6]!);
      corner(mesh, before[0]!, before[1]!, before[4]!, before[7]!, before[5]!, before[6]!);
      corner(mesh, here[2]!, here[3]!, here[4]!, here[8]!, here[5]!, here[6]!);
      corner(mesh, here[0]!, here[1]!, here[4]!, here[7]!, here[5]!, here[6]!);
    }
    const swap = before;
    before = here;
    here = swap;
  }
}

const edges = [new Float64Array(9), new Float64Array(9)] as const;

function bands(mesh: Mesh, c: Curl, h: number, part: Part) {
  mesh.count = 0;
  const left = c.fold.flat.x;
  const leaf: Point[] = [
    { x: left, y: 0 },
    { x: left + 1, y: 0 },
    { x: left + 1, y: h },
    { x: left, y: h },
  ];
  const quarter = (Math.PI / 2) * c.radius;
  const round = c.radius > 1e-5;

  const band = (from: number, to: number) => {
    const shape = cut(cut(leaf, c, from, false), c, to, true);
    for (let index = 1; index + 1 < shape.length; index++) {
      for (const at of [shape[0]!, shape[index]!, shape[index + 1]!]) {
        const place = lift(c, at);
        corner(mesh, place.x, place.y, place.z, at.x - left, at.y / h, along(c, at));
      }
    }
  };

  if (part === 'under') band(-Infinity, 0);
  if (round) {
    const start = part === 'under' ? 0 : quarter;
    for (let step = 0; step < STEPS; step++) {
      band(start + (quarter * step) / STEPS, start + (quarter * (step + 1)) / STEPS);
    }
  }
  if (part === 'over') band(2 * quarter, Infinity);
}

function cut(shape: Point[], c: Curl, edge: number, below: boolean): Point[] {
  if (!Number.isFinite(edge)) return shape;
  const kept: Point[] = [];
  for (let index = 0; index < shape.length; index++) {
    const a = shape[index]!;
    const b = shape[(index + 1) % shape.length]!;
    const da = along(c, a) - edge;
    const db = along(c, b) - edge;
    const keepA = below ? da <= 0 : da >= 0;
    const keepB = below ? db <= 0 : db >= 0;
    if (keepA) kept.push(a);
    if (keepA !== keepB) {
      const t = da / (da - db);
      kept.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }
  return kept;
}

export { bands, cloth, createMesh, panel, sheet, slab, STEPS, STRIDE, swing };
export type { Mesh, Part, Vec3 };
