import { projectDistance, rubberBand, solveSpring } from '@ui-sdk/core/gesture';

import {
  constrain,
  cornerPath,
  home,
  progressOf,
  type Corner,
  type Point,
  type Side,
} from './fold';

interface TurnsOptions {
  leafCount: number;
  limit?: number;
  turned?: number;
  aspect?: number;
  response?: number;
  damping?: number;
  stagger?: number;
  maxActive?: number;
  lift?: number;
  turnBack?: TurnBack;
  stiff?: (index: number) => boolean;
}

type TurnBack = 'mirror' | 'reverse';

interface Trailing {
  behind: number;
  velocityX: number;
}

interface ActiveLeaf {
  readonly index: number;
  readonly t: number;
  readonly target: 0 | 1;
  readonly from: Side;
  readonly corner: Corner;
  readonly point: Point;
  readonly held: boolean;
}

interface Under {
  left: number;
  right: number;
}

interface Leaf {
  index: number;
  target: 0 | 1;
  from: Side;
  corner: Corner;
  point: Point;
  held: boolean;
  bound: boolean;
  t: number;
  raw: number;
  velocity: number;
  speed: number;
  start: number;
  due: 0 | 1 | null;
  spring: ReturnType<typeof solveSpring> | null;
  offset: Point;
  span: number;
}

const POSITION_REST = 5e-4;
const VELOCITY_REST = 1e-5;
const THROW_RATE = 0.994;
const GIVE = 0.3;
const HOLD = 0.96;
const LEAD = 0.8;
const LEAD_TIME = 0.48;

function gate(ahead: number, hold: number) {
  const over = (ahead - hold) / (1 - POSITION_REST - hold);
  return Math.min(1, Math.max(0, over)) ** 2;
}

function clear(gone: number, hold: number) {
  return gone > 0 ? hold + (1 - POSITION_REST - hold) * Math.sqrt(Math.min(1, gone)) : 0;
}

function createTurns(options: TurnsOptions) {
  const response = options.response ?? 0.6;
  const damping = options.damping ?? 1;
  const stagger = options.stagger ?? 70;
  let maxActive = Math.max(2, options.maxActive ?? 6);
  const lift = options.lift ?? 0.22;
  let turnBack = options.turnBack ?? 'mirror';
  const stiff = options.stiff ?? (() => false);

  let leafCount = Math.max(0, options.leafCount);
  let limitTurned = Math.min(leafCount, options.limit ?? leafCount);
  let aspect = options.aspect ?? 1.4;
  let turned = clampTurned(options.turned ?? 0);
  let lastLaunch = -Infinity;
  let lastStiff = false;
  let lastForward = true;
  let stepped = -Infinity;

  const active: Leaf[] = [];
  const under: Under = { left: turned - 1, right: turned };

  const unseen = new Set<number>();

  function clampTurned(value: number) {
    return Math.min(limitTurned, Math.max(0, Math.round(value)));
  }

  function find(index: number) {
    return active.find((leaf) => leaf.index === index);
  }

  function remove(leaf: Leaf) {
    const at = active.indexOf(leaf);
    if (at >= 0) active.splice(at, 1);
  }

  function resting(index: number) {
    return !unseen.has(index) && !find(index);
  }

  function rebase() {
    if (active.length === 0) unseen.clear();
    let left = turned - 1;
    while (left >= 0 && !resting(left)) left--;
    let right = turned;
    while (right < leafCount && !resting(right)) right++;
    under.left = left;
    under.right = right;
  }

  function sideFor(t: number): Side {
    return t === 1 && turnBack === 'mirror' ? 'left' : 'right';
  }

  function aim(
    leaf: Leaf,
    target: 0 | 1,
    now: number,
    velocity = leaf.t === leaf.raw ? leaf.velocity : leaf.speed,
  ) {
    leaf.target = target;
    leaf.start = now;
    leaf.raw = leaf.t;
    leaf.velocity = velocity;
    leaf.spring = solveSpring(response, damping, leaf.t - target, velocity);
  }

  function launch(index: number, target: 0 | 1, now: number, corner: Corner) {
    const clear = lastStiff && !stiff(index) ? LEAD_TIME * response * 1000 : 0;
    const wait = Math.max(stagger, clear);
    const start = Math.max(now, lastLaunch + wait);
    lastLaunch = start;
    lastStiff = stiff(index);
    const from = 1 - target;
    active.push({
      index,
      target,
      from: sideFor(from),
      corner,
      point: cornerPath(from, corner, aspect, lift),
      held: false,
      bound: false,
      t: from,
      raw: from,
      velocity: 0,
      speed: 0,
      start,
      due: null,
      spring: solveSpring(response, damping, from - target, 0),
      offset: { x: 0, y: 0 },
      span: 0,
    });
  }

  function place(leaf: Leaf) {
    if (leaf.held) return;
    const path = cornerPath(leaf.t, leaf.corner, aspect, lift);
    if (leaf.span > 0) {
      const left = Math.min(1, Math.abs(leaf.t - leaf.target) / leaf.span);
      const fade = left * left;
      path.x += leaf.offset.x * fade;
      path.y += leaf.offset.y * fade;
    }
    leaf.point = constrain(path, leaf.corner, aspect);
  }

  function room(leaf: Leaf, other: Leaf, ahead: number, was: number) {
    const hard = stiff(leaf.index);
    if (hard === stiff(other.index)) return ahead;
    return Math.min(ahead, Math.max(gate(ahead, hard ? HOLD : LEAD), was));
  }

  function barred(leaf: Leaf, target: 0 | 1) {
    if (!stiff(leaf.index)) return false;
    const other = active[active.indexOf(leaf) + (target === 1 ? -1 : 1)];
    if (!other || stiff(other.index)) return false;
    const gone = target === 1 ? leaf.t : 1 - leaf.t;
    const ahead = target === 1 ? other.t : 1 - other.t;
    return gone > gate(ahead, HOLD);
  }

  function pin(target: 0 | 1, was: readonly number[]) {
    const ahead = target === 1 ? -1 : 1;
    const gone = (t: number) => (target === 1 ? t : 1 - t);
    let least = 0;
    for (
      let at = target === 1 ? active.length - 1 : 0;
      at >= 0 && at < active.length;
      at += ahead
    ) {
      const leaf = active[at]!;
      if (leaf.target !== target) continue;
      if (leaf.held) {
        least = 0;
        continue;
      }
      const before = gone(was[at]!);
      const behind = active[at - ahead];
      if (behind && !behind.held && behind.target !== target) {
        const other = gone(was[at - ahead]!);
        if (other <= before) least = Math.max(least, (before + other) / 2);
        if (stiff(behind.index) && !stiff(leaf.index)) least = Math.max(least, clear(other, HOLD));
      }
      if (before >= least - 1e-9) {
        leaf.t = target === 1 ? Math.max(leaf.t, least) : Math.min(leaf.t, 1 - least);
      }
      const next = active[at + ahead];
      if (next && next.target === target && stiff(leaf.index) !== stiff(next.index)) {
        least = Math.max(least, clear(before, stiff(leaf.index) ? HOLD : LEAD));
      }
    }
  }

  function order(was: readonly number[]) {
    for (const leaf of active) {
      leaf.t = leaf.held ? progressOf(leaf.point) : leaf.raw;
    }
    pin(1, was);
    pin(0, was);
    for (let index = 1; index < active.length; index++) {
      const leaf = active[index]!;
      if (leaf.held || leaf.target !== 1) continue;
      const other = active[index - 1]!;
      leaf.t = Math.min(leaf.t, room(leaf, other, other.t, was[index]!));
    }
    for (let index = active.length - 2; index >= 0; index--) {
      const leaf = active[index]!;
      if (leaf.held || leaf.target !== 0) continue;
      const other = active[index + 1]!;
      leaf.t = Math.max(leaf.t, 1 - room(leaf, other, 1 - other.t, 1 - was[index]!));
    }
  }

  function sort() {
    active.sort((a, b) => a.index - b.index);
  }

  function limit(now: number) {
    while (active.length > maxActive) {
      const waiting = active
        .filter((leaf) => !leaf.held && now < leaf.start)
        .sort((a, b) => a.start - b.start);

      if (waiting.length > 1) {
        const [skipped, ...rest] = waiting;
        remove(skipped!);
        unseen.add(skipped!.index);
        for (const leaf of rest) leaf.start = Math.max(now, leaf.start - stagger);
        lastLaunch = Math.max(now, lastLaunch - stagger);
        continue;
      }

      let nearest: Leaf | undefined;
      for (const leaf of active) {
        if (leaf.held || now < leaf.start) continue;
        if (!nearest || Math.abs(leaf.t - leaf.target) < Math.abs(nearest.t - nearest.target)) {
          nearest = leaf;
        }
      }
      if (!nearest) return;
      remove(nearest);
    }
  }

  function turnTo(next: number, now: number, corner: Corner = 'bottom') {
    next = clampTurned(next);
    if (next === turned) return;

    const forward = next > turned;
    const target = forward ? 1 : 0;
    if (forward !== lastForward) lastLaunch = -Infinity;
    lastForward = forward;

    const lifting: number[] = [];
    const count = Math.abs(next - turned);
    for (let step = 0; step < count; step++) {
      const index = forward ? turned + step : turned - 1 - step;
      const leaf = find(index);
      if (leaf) {
        if (leaf.held) leaf.target = target;
        else if (now < leaf.start) remove(leaf);
        else if (leaf.target === target) leaf.due = null;
        else if (barred(leaf, target)) leaf.due = target;
        else aim(leaf, target, now);
      } else if (!unseen.delete(index)) {
        lifting.push(index);
      }
    }

    const head = Math.ceil(maxActive / 2);
    const tail = lifting.length - (maxActive - head);
    lifting.forEach((index, position) => {
      if (lifting.length > maxActive && position >= head && position < tail) unseen.add(index);
      else launch(index, target, now, corner);
    });

    turned = next;

    if (unseen.delete(turned - 1)) launch(turned - 1, 1, now, corner);
    if (unseen.delete(turned)) launch(turned, 0, now, corner);

    sort();
    limit(now);
    rebase();
  }

  function step(now: number) {
    for (const leaf of active) {
      if (leaf.due !== null && !leaf.held && !barred(leaf, leaf.due)) {
        aim(leaf, leaf.due, now);
        leaf.due = null;
      }
    }
    for (const leaf of active) {
      if (leaf.held || !leaf.spring) continue;
      const elapsed = now - leaf.start;
      if (elapsed <= 0) continue;
      leaf.raw = Math.min(1, Math.max(0, leaf.target + leaf.spring.position(elapsed)));
      leaf.velocity = leaf.spring.velocity(elapsed);
    }

    const was = active.map((leaf) => leaf.t);
    order(was);

    const passed = now - stepped;
    stepped = now;
    for (const [index, leaf] of active.entries()) {
      if (passed > 0) leaf.speed = (leaf.t - was[index]!) / passed;
      if (!leaf.held && leaf.t !== leaf.raw && now > leaf.start)
        aim(leaf, leaf.target, now, leaf.speed);
    }

    let landed = false;
    for (let index = active.length - 1; index >= 0; index--) {
      const leaf = active[index]!;
      place(leaf);
      if (leaf.held || now <= leaf.start) continue;
      const arrived = Math.abs(leaf.t - leaf.target) < POSITION_REST;
      const stopped = Math.abs(leaf.velocity) < VELOCITY_REST || leaf.raw === leaf.target;
      if (!arrived || !stopped) continue;
      if (leaf.due !== null) {
        leaf.t = leaf.target;
        leaf.from = sideFor(leaf.target);
        aim(leaf, leaf.due, now, 0);
        leaf.due = null;
        continue;
      }
      active.splice(index, 1);
      landed = true;
    }
    if (landed) rebase();

    return active.some((leaf) => !leaf.held);
  }

  function grab(side: 'left' | 'right', now: number, corner: Corner): number {
    const index = side === 'right' ? under.right : under.left;
    if (index < 0 || index >= leafCount) return -1;

    const from = side === 'right' ? 0 : 1;
    active.push({
      index,
      target: from,
      from: sideFor(from),
      corner,
      point: cornerPath(from, corner, aspect, lift),
      held: true,
      bound: side === 'right' && index >= limitTurned,
      t: from,
      raw: from,
      velocity: 0,
      speed: 0,
      start: now,
      due: null,
      spring: null,
      offset: { x: 0, y: 0 },
      span: 0,
    });
    sort();
    rebase();
    return index;
  }

  function drag(index: number, point: Point) {
    const leaf = find(index);
    if (!leaf?.held) return;
    leaf.point = constrain(leaf.bound ? resist(point, leaf) : point, leaf.corner, aspect);
    leaf.t = progressOf(leaf.point);
  }

  function resist(point: Point, leaf: Leaf): Point {
    const rest = home(leaf.corner, aspect, leaf.from);
    const dx = point.x - rest.x;
    const dy = point.y - rest.y;
    const pulled = Math.hypot(dx, dy);
    if (pulled === 0) return rest;
    const shown = rubberBand(pulled, GIVE) / pulled;
    return { x: rest.x + dx * shown, y: rest.y + dy * shown };
  }

  function release(index: number, now: number, velocityX = 0, trailing?: Trailing): number {
    const leaf = find(index);
    if (!leaf?.held) return turned;

    const landing = leaf.point.x + (trailing?.behind ?? 0) + projectDistance(velocityX, THROW_RATE);
    const target = leaf.bound ? 0 : landing < 0 ? 1 : 0;
    const t = progressOf(leaf.point);
    const free = cornerPath(t, leaf.corner, aspect, lift);

    leaf.held = false;
    leaf.t = t;
    leaf.offset = { x: leaf.point.x - free.x, y: leaf.point.y - free.y };
    leaf.span = Math.abs(t - target);
    aim(leaf, target, now, leaf.bound ? 0 : -(trailing?.velocityX ?? velocityX) / 2);

    if (target === 1 && index >= turned) turnTo(index + 1, now, leaf.corner);
    else if (target === 0 && index < turned) turnTo(index, now, leaf.corner);
    return turned;
  }

  function jump(next: number) {
    turned = clampTurned(next);
    active.length = 0;
    lastLaunch = -Infinity;
    rebase();
  }

  return {
    active: active as readonly ActiveLeaf[],
    under: under as Readonly<Under>,
    get turned() {
      return turned;
    },
    get leafCount() {
      return leafCount;
    },
    setLeaves(count: number, limit = count, next = turned) {
      leafCount = Math.max(0, count);
      limitTurned = Math.min(leafCount, Math.max(0, limit));
      jump(next);
    },
    setAspect(value: number) {
      aspect = value;
    },
    setMaxActive(value: number) {
      maxActive = Math.max(2, Math.round(value));
    },
    setTurnBack(value: TurnBack) {
      turnBack = value;
    },
    turnTo,
    step,
    grab,
    drag,
    release,
    jump,
  };
}

type Turns = ReturnType<typeof createTurns>;

export { createTurns };
export type { ActiveLeaf, Trailing, TurnBack, Turns, TurnsOptions, Under };
