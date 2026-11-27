import { solveSpring } from '@ui-sdk/core/gesture';

import type { Point } from './fold';
import type { Under } from './turns';

interface Strip {
  points: Float64Array;
  count: number;
  width: number;
  colour: string;
  opacity: number;
  gap: number;
  side: -1 | 1;
  held: number;
  lift: number;
  from: number;
  joint: number;
}

interface RibbonScene {
  h: number;
  left: boolean;
  leafCount: number;
  under: Under;
  turned: number;
  turning: boolean;
  still: boolean;
}

const RIBBON_WIDTH = 0.032;
const RIBBON_AT = 0.022;
const RIBBON_TAIL = 0.15;
const SEWN = 0.045;
const JOINT = 0.008;
const SLOWEST = 50;
const MOVE = 0.5;
const MOVES = 240;
const KEEP = 0.96;
const STOPPED = 0.04;
const WEIGHT = 0.86;
const FASTEST = 4;
const SWINGS = 8;
const ROUND_LEAD = 0.12;
const GATHER = 0.001;
const THROW = 4;
const RISE = { ms: 220, dip: 0.014, past: 0.02 };
const DROP = {
  period: 0.46,
  damping: 0.66,
  start: 0.04,
  ms: 900,
  sway: 0.011,
  waves: 1.15,
  beat: 300,
  dies: 190,
};
const CLEAR = 0.02;
const FALL = solveSpring(DROP.period, DROP.damping, DROP.start - 1, 0);
const TAUT = 0.985;
const DRAWN = 0.998;
const REST = 0.02;
const LOW = 2 / 3;
const DRAW = { least: 240, each: 150, most: 620, flung: 240 };
const SETTLE = 160;
const FLUNG = 1.2;
const SWING = 60;
const ASKEW = 0.35;
const RUN = 0.03;
const LIFT = { up: 45, down: 75 };

function overRibbon(strip: Strip, index: number, lies: -1 | 1) {
  if (lies !== strip.side) return false;
  return lies === 1 ? index < strip.gap : index >= strip.gap;
}

const PLACE = 9;
const FAIR = 0.02;
const ROOT = { fair: 0.055, rise: 0.09, hold: 0.11, gone: 0.42 };
const FIXED = 0.03;
const TWIST = 0.75;
const BANKS = { most: 0.9, from: 0.3, to: 1.6 };
const CLOSES = { from: 0.008, to: 0.003 };
const ROUND = 0.35;
const LIFTED = 0.22;

interface Laid {
  places: Float64Array;
  runs: number[];
  width: number;
}

let fair = new Float64Array(256);
let faired = new Float64Array(256);
let fairness = new Int16Array(128);
let middle = new Float64Array(256);
let reaches = new Float64Array(128);
let turns = new Float64Array(128);
let ways = new Float64Array(128);

function fairAt(along: number) {
  if (along <= 0) return 0;
  const smooth = (share: number) => {
    const t = Math.min(1, Math.max(0, share));
    return t * t * (3 - 2 * t);
  };
  const root =
    smooth(along / ROOT.rise) * (1 - smooth((along - ROOT.hold) / (ROOT.gone - ROOT.hold)));
  return Math.min(1, along / FIXED) * (FAIR + (ROOT.fair - FAIR) * root);
}

function layOf(
  strip: Strip,
  { slant = 0 }: { slant?: number } = {},
  out: Laid = { places: new Float64Array(0), runs: [], width: 0 },
): Laid {
  const { points, count, width } = strip;
  out.runs.length = 0;
  out.width = width;
  if (count < 2) return out;
  const joint = strip.joint > 0 ? strip.joint : 0.008;

  const lead = Math.ceil((3 * ROOT.fair) / joint);
  const size = lead + count + 1;
  if (fair.length < size * 2) {
    fair = new Float64Array(size * 4);
    faired = new Float64Array(size * 4);
    fairness = new Int16Array(size * 2);
  }
  let most = 0;
  for (let index = 0; index < size; index++) {
    const share = fairAt(strip.from + (index - lead) * joint) / joint;
    fairness[index] = index === 0 || index === size - 1 ? 0 : Math.round(2 * share * share);
    most = Math.max(most, fairness[index]!);
  }
  for (let index = 0; index < lead; index++) {
    fair[index * 2] = points[0]!;
    fair[index * 2 + 1] = points[1]! - (lead - index) * joint;
  }
  for (let at = 0; at < count * 2; at++) fair[lead * 2 + at] = points[at]!;
  const past = (line: Float64Array) => {
    line[size * 2 - 2] = 2 * line[size * 2 - 4]! - line[size * 2 - 6]!;
    line[size * 2 - 1] = 2 * line[size * 2 - 3]! - line[size * 2 - 5]!;
  };
  past(fair);
  let line = fair;
  let next = faired;
  for (let pass = 1; pass <= most; pass++) {
    next.set(line.subarray(0, size * 2));
    for (let index = 1; index < size - 1; index++) {
      if (fairness[index]! < pass) continue;
      const at = index * 2;
      next[at] = (line[at - 2]! + 2 * line[at]! + line[at + 2]!) / 4;
      next[at + 1] = (line[at - 1]! + 2 * line[at + 1]! + line[at + 3]!) / 4;
    }
    past(next);
    const swap = line;
    line = next;
    next = swap;
  }
  const x = (index: number) => line[(lead + index) * 2]!;
  const y = (index: number) => line[(lead + index) * 2 + 1]!;

  const steps = (count - 1) * 2;
  if (middle.length < (steps + 1) * 2) {
    middle = new Float64Array((steps + 1) * 4);
    reaches = new Float64Array((steps + 1) * 2);
    turns = new Float64Array((steps + 1) * 2);
    ways = new Float64Array((steps + 1) * 2);
  }
  for (let step = 0; step <= steps; step++) {
    const index = step >> 1;
    if (step % 2 === 0) {
      middle[step * 2] = x(index);
      middle[step * 2 + 1] = y(index);
      continue;
    }
    const a = Math.max(0, index - 1);
    const d = Math.min(count - 1, index + 2);
    middle[step * 2] = (-x(a) + 9 * x(index) + 9 * x(index + 1) - x(d)) / 16;
    middle[step * 2 + 1] = (-y(a) + 9 * y(index) + 9 * y(index + 1) - y(d)) / 16;
  }
  const mx = (step: number) => middle[step * 2]!;
  const my = (step: number) => middle[step * 2 + 1]!;

  reaches[0] = 0;
  for (let step = 1; step <= steps; step++) {
    reaches[step] =
      reaches[step - 1]! + Math.hypot(mx(step) - mx(step - 1), my(step) - my(step - 1));
  }
  const apart = (a: number, b: number) => Math.hypot(mx(a) - mx(b), my(a) - my(b));
  for (let step = 0; step <= steps; step++) {
    turns[step] = 0;
    if (step === 0 || step === steps || apart(step, step + 1) < 1e-9) continue;
    let before = step - 1;
    while (before > 0 && apart(before, step) < 1e-9) before--;
    const ax = mx(step) - mx(before);
    const ay = my(step) - my(before);
    const bx = mx(step + 1) - mx(step);
    const by = my(step + 1) - my(step);
    if (Math.hypot(ax, ay) > 1e-9) turns[step] = Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  }

  const window = TWIST * width;
  let from = 0;
  let to = 0;
  for (let step = 0; step <= steps; step++) {
    const reach = reaches[step]!;
    while (from < step && reach - reaches[from]! >= window) from++;
    while (to < steps && reaches[to + 1]! - reach < window) to++;
    let way = 0;
    for (let near = from; near <= to; near++) {
      const weight = 1 - Math.abs(reaches[near]! - reach) / window;
      if (weight > 0) way += turns[near]! * weight;
    }
    ways[step] = way;
  }

  let room = steps + 1;
  for (let step = 1; step < steps; step++) {
    if (Math.abs(turns[step]!) > ROUND) room += Math.ceil(Math.abs(turns[step]!) / ROUND);
  }
  if (out.places.length < room * PLACE) out.places = new Float64Array(room * PLACE * 2);
  const { places } = out;
  const smooth = (share: number) => {
    const t = Math.min(1, Math.max(0, share));
    return t * t * (3 - 2 * t);
  };
  const held = Math.min(count - 1, Math.max(0, strip.held)) * 2;
  const half = width / 2;
  let place = 0;
  let extra = 0;
  for (let step = 0; step <= steps; step++) {
    const reach = reaches[step]!;
    const turn = turns[step]!;
    const way = ways[step]!;
    const roll =
      BANKS.most *
      smooth((Math.abs(way) - BANKS.from) / (BANKS.to - BANKS.from)) *
      (way < 0 ? -1 : 1);

    let inner = half;
    if (Math.abs(way) > 1e-6) {
      const round = window / Math.abs(way);
      const clear = round - half;
      const closing = clear > 0 ? 1 - smooth((clear - CLOSES.to) / (CLOSES.from - CLOSES.to)) : 0;
      inner = Math.min(round, half + closing * Math.max(0, round - half));
    }

    let lift = 0;
    if (strip.held >= 0) {
      const near = 1 - Math.min(1, Math.abs(reach - reaches[held]!) / LIFTED);
      lift = strip.lift * near * near * (3 - 2 * near);
    }
    const cut = step === steps ? slant * width : 0;

    const write = (tx: number, ty: number, left: number, right: number) => {
      const at = place * PLACE;
      places[at] = mx(step) - ty * left + tx * cut;
      places[at + 1] = my(step) + tx * left + ty * cut;
      places[at + 2] = mx(step) + ty * right - tx * cut;
      places[at + 3] = my(step) - tx * right - ty * cut;
      places[at + 4] = mx(step);
      places[at + 5] = my(step);
      places[at + 6] = reach + extra;
      places[at + 7] = roll;
      places[at + 8] = lift;
      place++;
    };

    let before = Math.max(0, step - 1);
    let after = Math.min(steps, step + 1);
    while (before > 0 && apart(before, step) < 1e-9) before--;
    while (after < steps && apart(after, step) < 1e-9) after++;
    if (Math.abs(turn) > ROUND && before < step && after > step) {
      const from = Math.atan2(my(step) - my(before), mx(step) - mx(before));
      const parts = Math.ceil(Math.abs(turn) / ROUND);
      for (let part = 0; part <= parts; part++) {
        const angle = from + (turn * part) / parts;
        if (part > 0) extra += (half * Math.abs(turn)) / (2 * parts);
        write(Math.cos(angle), Math.sin(angle), turn > 0 ? 0 : half, turn > 0 ? half : 0);
      }
      continue;
    }
    let tx = mx(after) - mx(before);
    let ty = my(after) - my(before);
    const length = Math.hypot(tx, ty);
    tx = length > 1e-9 ? tx / length : 0;
    ty = length > 1e-9 ? ty / length : 0;
    write(tx, ty, way > 0 ? inner : half, way > 0 ? half : inner);
  }
  out.runs.push(0, place - 1);

  return out;
}

function createRibbon({ joint = JOINT }: { joint?: number } = {}) {
  const strip: Strip = {
    points: new Float64Array(0),
    count: 0,
    width: RIBBON_WIDTH,
    colour: '',
    opacity: 1,
    gap: 0,
    side: 1,
    held: -1,
    lift: 0,
    from: 0,
    joint,
  };
  let points = new Float64Array(0);
  let lengths = new Float64Array(0);
  let before = new Float64Array(0);
  let speeds = new Float64Array(0);
  let count = 0;
  let made = NaN;
  let side: -1 | 1 = 1;
  let head = NaN;
  let exposed = false;
  let lies: 'neat' | 'loose' | 'drawn' | 'settling' | 'rising' | 'laid' = 'neat';
  let since = NaN;
  let from: Point = { x: 0, y: 0 };
  let length = 0;
  let flung = 0;
  let shape = new Float64Array(0);
  let grown = 1;
  let sway = 0;
  let wave = 0;
  let left = 0;
  let root = 0;
  let held = -1;
  let hand: Point = { x: 0, y: 0 };
  let swing = Math.PI / 2;
  let lifted = -1;
  let lift = 0;
  let thrown = -1;
  let speed: Point = { x: 0, y: 0 };
  let aim: Point = { x: 0, y: 0 };
  let moved = 0;
  let last = NaN;
  let seen: RibbonScene | undefined;
  let exit = 0;

  const down = (index: number) => lengths[index]! * grown;

  const put = (index: number, x: number, y: number) => {
    points[index * 2] = x;
    points[index * 2 + 1] = y;
  };

  function straight() {
    grown = 1;
    sway = 0;
    for (let index = 0; index < count; index++) put(index, head, down(index));
    lies = 'neat';
    thrown = -1;
  }

  function first() {
    if (!exposed) return exit;
    let index = 0;
    while (index < exit && lengths[index + 1]! <= SEWN) index++;
    return index;
  }

  const shows = () => (exposed ? 0 : exit);

  function swingOn(lead: number, fast: number, ms: number) {
    if (ms <= 0) return;
    const kept = WEIGHT ** (ms / (1000 / 120));
    for (let pass = 0; pass < 2; pass++) {
      let lastX = speeds[(fast + 1) * 2] ?? 0;
      let lastY = speeds[(fast + 1) * 2 + 1] ?? 0;
      for (let index = fast + 1; index < lead; index++) {
        const at = index * 2;
        const hereX = speeds[at]!;
        const hereY = speeds[at + 1]!;
        const nextX = index + 1 < lead ? speeds[at + 2]! : hereX;
        const nextY = index + 1 < lead ? speeds[at + 3]! : hereY;
        speeds[at] = (lastX + 2 * hereX + nextX) / 4;
        speeds[at + 1] = (lastY + 2 * hereY + nextY) / 4;
        lastX = hereX;
        lastY = hereY;
      }
    }
    const times = Math.max(1, Math.ceil(ms / SWINGS));
    const each = ms / times / 1000;
    const reach = () => {
      let far = 0;
      for (let index = fast + 1; index <= lead; index++) {
        far += Math.hypot(
          points[index * 2]! - points[index * 2 - 2]!,
          points[index * 2 + 1]! - points[index * 2 - 1]!,
        );
      }
      return far;
    };
    for (let time = 0; time < times; time++) {
      let swung = false;
      const was = reach();
      shape.set(points);
      for (let index = lead - 1; index > fast; index--) {
        const at = index * 2;
        const gap = Math.hypot(shape[at]! - shape[at + 2]!, shape[at + 1]! - shape[at + 3]!);
        let vx = speeds[at]! * kept;
        let vy = speeds[at + 1]! * kept;
        const dx = points[at + 2]! - points[at]!;
        const dy = points[at + 3]! - points[at + 1]!;
        const far = Math.hypot(dx, dy);
        if (far > 1e-9) {
          const towards = (vx * dx + vy * dy) / far;
          if (towards > 0) {
            vx -= (towards * dx) / far;
            vy -= (towards * dy) / far;
          }
        }
        const fastness = Math.hypot(vx, vy);
        let x = points[at]!;
        let y = points[at + 1]!;
        if (fastness >= REST) {
          const most = Math.min(FASTEST * each, ROUND_LEAD * (lengths[lead]! - lengths[index]!));
          const scale = Math.min(1, most / (fastness * each));
          x += vx * scale * each;
          y += vy * scale * each;
          swung = true;
        }
        const ox = x - points[at + 2]!;
        const oy = y - points[at + 3]!;
        const off = Math.hypot(ox, oy);
        const keep = fastness >= REST ? gap : Math.max(off, 0);
        const joint = lengths[index + 1]! - lengths[index]!;
        const apart = Math.min(joint, keep);
        if (off > 1e-9 && apart > 1e-9 && (fastness >= REST || off > joint)) {
          x = points[at + 2]! + (ox * apart) / off;
          y = points[at + 3]! + (oy * apart) / off;
        }
        moved = Math.max(moved, Math.hypot(x - points[at]!, y - points[at + 1]!));
        put(index, x, y);
      }
      if (!swung) {
        points.set(shape);
        break;
      }
      follow(fast, lead, true);
      if (reach() < was - GATHER * (lengths[lead]! - lengths[fast]!)) {
        points.set(shape);
        speeds.fill(0);
        break;
      }
    }
  }

  function follow(start: number, end: number, all = false) {
    const way = end > start ? 1 : -1;
    let index = start + way;
    for (; index !== end + way; index += way) {
      const a = (index - way) * 2;
      const b = index * 2;
      const reach = Math.abs(down(index) - down(index - way));
      const dx = points[b]! - points[a]!;
      const dy = points[b + 1]! - points[a + 1]!;
      const far = Math.hypot(dx, dy);
      if (far <= reach + 1e-12) {
        if (all) continue;
        break;
      }
      points[b] = points[a]! + (dx * reach) / far;
      points[b + 1] = points[a + 1]! + (dy * reach) / far;
      moved = Math.max(moved, far - reach);
    }
    return index;
  }

  function carry(index: number, x: number, y: number, fast: number, stiff: boolean) {
    const end = count - 1;
    const fx = points[index * 2]!;
    const fy = points[index * 2 + 1]!;
    const stride = MOVE * (lengths[end]! / end) * grown;
    const moves = Math.max(1, Math.min(MOVES, Math.ceil(Math.hypot(x - fx, y - fy) / stride)));
    const a = index * 2;
    const b = a - 2;
    const reach = down(index) - down(index - 1);
    const give = () => {
      const dx = points[a]! - points[b]!;
      const dy = points[a + 1]! - points[b + 1]!;
      const far = Math.hypot(dx, dy);
      if (far <= reach + 1e-9) return false;
      put(index, points[b]! + (dx * reach) / far, points[b + 1]! + (dy * reach) / far);
      return true;
    };
    for (let move = 1; move <= moves; move++) {
      put(index, fx + ((x - fx) * move) / moves, fy + ((y - fy) * move) / moves);
      for (let pass = 0; pass < 4; pass++) {
        follow(index, fast + 1);
        follow(fast, index);
        const dx = points[a]! - points[b]!;
        const dy = points[a + 1]! - points[b + 1]!;
        if (Math.hypot(dx, dy) <= reach + 1e-9) break;
      }
      give();
      trail(index, stiff);
    }
  }

  function trail(index: number, stiff: boolean) {
    const end = count - 1;
    if (!stiff) {
      follow(index, end);
      return;
    }
    for (let past = index + 1; past <= end; past++) {
      const off = down(past) - down(index);
      put(
        past,
        points[index * 2]! + Math.cos(swing) * off,
        points[index * 2 + 1]! + Math.sin(swing) * off,
      );
    }
  }

  function draw(now: number, going = false) {
    if (count === 0 || lies === 'neat' || lies === 'rising' || lies === 'laid') return;
    const end = count - 1;
    lies = 'drawn';
    since = now;
    thrown = -1;
    if (!going) speed = { x: 0, y: 0 };
    flung = Math.min(1, Math.hypot(speed.x, speed.y) / FLUNG);
    from = { x: points[end * 2]!, y: points[end * 2 + 1]! };
    const far = Math.hypot(from.x - head, from.y - down(end));
    length = Math.min(DRAW.most, DRAW.least + DRAW.each * far) + DRAW.flung * flung;
  }

  function clear() {
    if (exposed) return;
    for (let index = exit + 1; index < count; index++) {
      const least = made + Math.min(CLEAR, down(index) - down(exit));
      if (points[index * 2 + 1]! < least) points[index * 2 + 1] = least;
    }
  }

  function layAt(along: number, out: Point) {
    const end = count - 1;
    if (along >= lengths[end]!) {
      let back = end;
      while (back > root && lengths[end]! - lengths[back]! < RUN) back--;
      const dx = shape[end * 2]! - shape[back * 2]!;
      const dy = shape[end * 2 + 1]! - shape[back * 2 + 1]!;
      const far = Math.hypot(dx, dy);
      const over = along - lengths[end]!;
      out.x = shape[end * 2]! + (far > 1e-6 ? (dx / far) * over : 0);
      out.y = shape[end * 2 + 1]! + (far > 1e-6 ? (dy / far) * over : over);
      return;
    }
    let index = root;
    while (index < end - 1 && lengths[index + 1]! <= along) index++;
    const share = Math.max(0, (along - lengths[index]!) / (lengths[index + 1]! - lengths[index]!));
    out.x = shape[index * 2]! + (shape[index * 2 + 2]! - shape[index * 2]!) * share;
    out.y = shape[index * 2 + 1]! + (shape[index * 2 + 3]! - shape[index * 2 + 1]!) * share;
  }
  const spot: Point = { x: 0, y: 0 };

  function step(now: number, scene: RibbonScene, gap: number) {
    const { h } = scene;
    if (count === 0 || made !== h) {
      const body = Math.max(1, Math.round(h / joint));
      const tail = Math.max(1, Math.round(RIBBON_TAIL / joint));
      count = body + tail + 1;
      points = new Float64Array(count * 2);
      before = new Float64Array(count * 2);
      speeds = new Float64Array(count * 2);
      shape = new Float64Array(count * 2);
      lengths = Float64Array.from({ length: count }, (_, index) =>
        index <= body ? (h * index) / body : h + (RIBBON_TAIL * (index - body)) / tail,
      );
      exit = body;
      made = h;
      head = NaN;
      held = lifted = thrown = -1;
      lift = 0;
      lies = 'neat';
    }
    const ms = Number.isNaN(last) ? 0 : Math.min(SLOWEST, Math.max(0, now - last));
    last = now;
    seen = scene;
    moved = 0;
    if (Number.isNaN(since) && lies !== 'neat' && lies !== 'loose') since = now;

    let landed = false;
    if (lies === 'rising' && (scene.still || now - since >= RISE.ms)) {
      lies = 'laid';
      since = now;
      landed = true;
    }
    const here = lies === 'rising' ? left : gap;

    strip.gap = here;
    strip.opacity = scene.leafCount > 1 ? 1 : 0;
    const was = exposed;
    const { left: onLeft, right: onRight } = scene.under;
    const bare = { left: onLeft < 0, right: onRight >= scene.leafCount };
    if (!scene.left) side = 1;
    else if (onLeft >= here - 1) side = -1;
    else if (onRight <= here) side = 1;
    else if (bare.left !== bare.right) side = bare.right ? -1 : 1;
    strip.side = side;
    exposed = side === -1 ? onLeft === here - 1 : onRight === here;

    const home = side * RIBBON_AT;
    const fresh = Number.isNaN(head);
    if (fresh || scene.still || landed) {
      head = home;
      if (fresh) straight();
    } else {
      head += (home - head) * (1 - Math.exp(-ms / 50));
      if (Math.abs(home - head) < 1e-4) head = home;
    }

    if (scene.turning && (held >= 0 || lies === 'loose')) {
      held = -1;
      draw(now);
    }

    grown = 1;
    sway = 0;
    let waits = false;
    if (lies === 'laid') {
      if (!exposed && scene.turning && !scene.still) {
        since = now;
        waits = true;
      }
      const time = now - since;
      if (time >= DROP.ms || scene.still || (!exposed && !waits)) {
        lies = 'neat';
      } else {
        grown = Math.max(DROP.start, 1 + FALL.position(time));
        sway = DROP.sway * Math.exp(-time / DROP.dies) * Math.min(1, grown);
        wave = time / DROP.beat;
      }
    }

    if (scene.still && held < 0 && (lies === 'drawn' || lies === 'settling' || was !== exposed))
      straight();
    if (was !== exposed && held < 0 && lies === 'loose') straight();

    const end = count - 1;
    if (lies === 'drawn' && now - since >= length) {
      lies = 'settling';
      since = now;
      shape.set(points);
    }
    if (lies === 'settling' && now - since >= SETTLE) lies = 'neat';

    const fast = first();
    let shown = shows();
    if (lies === 'rising') {
      const share = Math.min(1, (now - since) / RISE.ms);
      const whole = lengths[end]! - lengths[root]! + RISE.past;
      const risen = whole * share ** 3 - RISE.dip * 6.75 * share * (1 - share) ** 2;
      shown = root;
      for (let index = root; index <= end; index++) {
        const along = lengths[index]! - risen;
        if (along <= lengths[root]!) {
          put(index, shape[root * 2]!, shape[root * 2 + 1]!);
          shown = index;
        } else {
          layAt(along, spot);
          put(index, spot.x, spot.y);
        }
      }
    } else if (lies === 'neat' || lies === 'laid') {
      const whole = lengths[end]!;
      for (let index = 0; index <= end; index++) {
        const share = lengths[index]! / whole;
        const aside =
          sway === 0 ? 0 : sway * share * Math.sin(2 * Math.PI * (DROP.waves * share - wave));
        put(index, head + aside, down(index));
      }
      if (waits) shown = end;
    } else {
      for (let index = 0; index <= fast; index++) put(index, head, down(index));
    }

    if (lies === 'settling') {
      const along = 1 - (1 - Math.min(1, (now - since) / SETTLE)) ** 3;
      for (let index = fast + 1; index <= end; index++) {
        const x = shape[index * 2]!;
        const y = shape[index * 2 + 1]!;
        put(index, x + (head - x) * along, y + (down(index) - y) * along);
      }
    } else if (lies === 'drawn') {
      if (Math.hypot(speed.x, speed.y) > STOPPED && !scene.still) {
        from = { x: from.x + (speed.x * ms) / 1000, y: from.y + (speed.y * ms) / 1000 };
        const kept = KEEP ** (ms / (1000 / 120));
        speed = { x: speed.x * kept, y: speed.y * kept };
      }
      const share = Math.min(1, (now - since) / length);
      const along =
        1 - (1 - share) ** 3 + (share * share * (3 - 2 * share) - (1 - (1 - share) ** 3)) * flung;
      const reach = down(fast) + (down(end) - down(fast)) * DRAWN;
      swingOn(end, fast, ms);
      carry(end, from.x + (head - from.x) * along, from.y + (reach - from.y) * along, fast, false);
      clear();
    } else if (lies === 'loose') {
      if (held >= 0) {
        if (!scene.still) swingOn(held, fast, ms);
        grip(ms, fast);
        clear();
      } else {
        follow(fast, end);
        const fastness = Math.hypot(speed.x, speed.y);
        if (thrown > fast && !scene.still) swingOn(thrown, fast, ms);
        if (thrown > fast && fastness > STOPPED && !scene.still) {
          const x = aim.x + (speed.x * ms) / 1000;
          const y = aim.y + (speed.y * ms) / 1000;
          const reach = (down(thrown) - down(fast)) * TAUT;
          const dx = x - points[fast * 2]!;
          const dy = y - points[fast * 2 + 1]!;
          const far = Math.hypot(dx, dy);
          const scale = far > reach ? reach / far : 1;
          const tx = points[fast * 2]! + dx * scale;
          const ty = points[fast * 2 + 1]! + dy * scale;
          const out = far > reach ? (speed.x * dx + speed.y * dy) / far : 0;
          if (out > 0) speed = { x: speed.x - (out * dx) / far, y: speed.y - (out * dy) / far };
          aim = { x: tx, y: ty };
          for (let past = thrown + 1; past <= end; past++) {
            shape[past * 2] = points[past * 2]! - points[thrown * 2]!;
            shape[past * 2 + 1] = points[past * 2 + 1]! - points[thrown * 2 + 1]!;
          }
          carry(thrown, tx, ty, fast, false);
          for (let past = thrown + 1; past <= end; past++) {
            put(
              past,
              points[thrown * 2]! + shape[past * 2]!,
              points[thrown * 2 + 1]! + shape[past * 2 + 1]!,
            );
          }
          clear();
          const kept = KEEP ** (ms / (1000 / 120));
          speed = { x: speed.x * kept, y: speed.y * kept };
        } else {
          if (moved <= 1e-4) {
            const low = thrown > fast && points[thrown * 2 + 1]! >= made * LOW;
            thrown = -1;
            if (low && !scene.still) draw(now);
          }
        }
      }
    }

    const up = held >= 0 ? 1 : 0;
    lift += (up - lift) * (1 - Math.exp(-ms / (up === 1 ? LIFT.up : LIFT.down)));
    if (Math.abs(up - lift) < 0.004 || scene.still) lift = up;

    const free = (lies === 'loose' || lies === 'drawn') && ms > 0 && !scene.still;
    for (let at = 0; at < count * 2; at++) {
      speeds[at] = free ? ((points[at]! - before[at]!) / ms) * 1000 : ms > 0 ? 0 : speeds[at]!;
      before[at] = points[at]!;
    }

    strip.points = points.subarray(shown * 2);
    strip.count = count - shown;
    strip.held = lifted - shown;
    strip.lift = lift;
    strip.from = lengths[lies === 'rising' ? root : shown]!;
    strip.joint = lengths[exit]! / exit;

    if (scene.still && held < 0) return false;
    return (
      held >= 0 ||
      lies === 'drawn' ||
      lies === 'settling' ||
      lies === 'rising' ||
      lies === 'laid' ||
      head !== home ||
      was !== exposed ||
      lift !== up ||
      thrown >= 0 ||
      moved > 1e-4
    );
  }

  function grip(ms: number, fast: number) {
    const ax = points[fast * 2]!;
    const ay = points[fast * 2 + 1]!;
    const full = down(held) - down(fast);
    const reach = Math.max(
      full * TAUT,
      Math.min(full, Math.hypot(points[held * 2]! - ax, points[held * 2 + 1]! - ay)),
    );
    const dx = hand.x - ax;
    const dy = (exposed ? hand.y : Math.max(hand.y, made + CLEAR)) - ay;
    const far = Math.hypot(dx, dy);
    const scale = far > reach ? reach / far : 1;

    let back = held;
    while (back > fast && down(held) - down(back) < RUN) back--;
    const rx = points[held * 2]! - points[back * 2]!;
    const ry = points[held * 2 + 1]! - points[back * 2 + 1]!;
    if (back < held && Math.hypot(rx, ry) > 0.3 * (down(held) - down(back))) {
      let turn = Math.atan2(ry, rx) - swing;
      turn -= Math.round(turn / (2 * Math.PI)) * 2 * Math.PI;
      const left = turn * Math.exp(-ms / SWING);
      swing += turn - Math.sign(left) * Math.min(Math.abs(left), ASKEW);
    }
    carry(held, ax + dx * scale, ay + dy * scale, fast, true);
  }

  function lay(now: number) {
    if (count === 0 || Number.isNaN(head)) return;
    held = -1;
    thrown = -1;
    if (lies === 'rising') return;
    lies = 'rising';
    since = now;
    left = strip.gap;
    root = shows();
    if (strip.count < 2) since = now - RISE.ms;
    shape.set(points);
  }

  function grab(point: Point) {
    if (count === 0) return;
    let nearest = count - 1;
    let least = Infinity;
    for (let index = exit + 1; index < count; index++) {
      const away = Math.hypot(points[index * 2]! - point.x, points[index * 2 + 1]! - point.y);
      if (away < least) {
        least = away;
        nearest = index;
      }
    }
    if (lies === 'laid' || lies === 'rising') straight();
    lies = 'loose';
    thrown = -1;
    held = lifted = nearest;
    const end = count - 1;
    const ex = points[end * 2]! - points[held * 2]!;
    const ey = points[end * 2 + 1]! - points[held * 2 + 1]!;
    swing = Math.hypot(ex, ey) > 1e-6 ? Math.atan2(ey, ex) : Math.PI / 2;
    pull(point);
  }

  function pull(point: Point) {
    if (held < 0) return;
    hand = point;
  }

  function release(velocity: Point) {
    if (held < 0) return false;
    grip(0, first());
    const fastness = Math.hypot(velocity.x, velocity.y);
    const scale = fastness > THROW ? THROW / fastness : 1;
    thrown = held;
    speed = { x: velocity.x * scale, y: velocity.y * scale };
    aim = { x: points[held * 2]!, y: points[held * 2 + 1]! };
    held = -1;
    if (exposed && hand.y < made * LOW) return false;
    draw(last, true);
    return true;
  }

  function back() {
    held = -1;
    if (seen?.still) {
      straight();
      return;
    }
    draw(last);
  }

  return {
    strip,
    step,
    lay,
    grab,
    pull,
    release,
    back,
    get held() {
      return held >= 0;
    },
    get exposed() {
      return exposed;
    },
    get neat() {
      return lies === 'neat';
    },
    tail(): [number, number, number, number] {
      if (count === 0) return [0, 0, 0, 0];
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (let index = exit; index < count; index++) {
        const x = points[index * 2]!;
        const y = points[index * 2 + 1]!;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
      return [left - RIBBON_WIDTH / 2, top, right + RIBBON_WIDTH / 2, bottom];
    },
    wake() {
      last = NaN;
    },
  };
}

type Ribbon = ReturnType<typeof createRibbon>;

export { createRibbon, layOf, overRibbon, PLACE, RIBBON_AT, RIBBON_TAIL, RIBBON_WIDTH };
export type { Laid, Ribbon, RibbonScene, Strip };
