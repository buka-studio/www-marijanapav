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

/**
 * Schedules any number of leaves turning at once. `turned` says how many lie on the left and changes the moment a
 * turn is asked for; each leaf then goes to its side on its own spring, so turns overlap and a reversed turn
 * carries its speed back. Nothing here touches the page: a renderer reads `active` and `under` after each `step`.
 */

interface TurnsOptions {
  leafCount: number;
  /** Most leaves that may lie on the left. Default all; one fewer keeps a last leaf with a blank back from turning. */
  limit?: number;
  /** How many start on the left. Default 0. */
  turned?: number;
  /** Page height over page width. Default 1.4. */
  aspect?: number;
  /** The spring's period, in seconds. Default 0.6. */
  response?: number;
  /** The spring's damping ratio: 1 never overshoots. Default 1. */
  damping?: number;
  /** Least time between two leaves lifting, in ms. Default 70. */
  stagger?: number;
  /** Most leaves in the air at once. Default 6. */
  maxActive?: number;
  /** How high a free corner arcs, in page widths. Default 0.22. */
  lift?: number;
  /**
   * How a leaf turns back. `mirror` lifts it by its outer left corner, the mirror image of a forward turn; `reverse`
   * plays the forward turn backward, so it unfolds from the spine. Default `mirror`.
   */
  turnBack?: TurnBack;
  /**
   * Whether a leaf is stiff, like a cover. A stiff leaf swings on the spine and a page peels across it, so a stiff
   * leaf lifts once the page ahead of it has all but landed, and a page once the stiff leaf ahead is well over.
   */
  stiff?: (index: number) => boolean;
}

type TurnBack = 'mirror' | 'reverse';

/** A held corner that hasn't caught up with the pointer holding it. */
interface Trailing {
  /** How far the pointer is from the corner, in page widths: negative is further left. */
  behind: number;
  /** The corner's speed, in page widths per ms. */
  velocityX: number;
}

/** A leaf that is turning, waiting to turn, or held. */
interface ActiveLeaf {
  readonly index: number;
  /** How far it has turned: 0 lying right, 1 lying left. */
  readonly t: number;
  /** The side it is heading for. */
  readonly target: 0 | 1;
  /** The side it lifted from, which says how it folds. */
  readonly from: Side;
  /** The corner the fold is measured from. */
  readonly corner: Corner;
  /** Where that corner is. */
  readonly point: Point;
  readonly held: boolean;
}

/** The resting pages that show beneath the leaves in the air. */
interface Under {
  /** The leaf whose back shows on the left, or -1. */
  left: number;
  /** The leaf whose front shows on the right, or `leafCount`. */
  right: number;
}

interface Leaf {
  index: number;
  target: 0 | 1;
  from: Side;
  corner: Corner;
  point: Point;
  held: boolean;
  /** Whether it is the last leaf, which lifts under a pull but may not turn. */
  bound: boolean;
  /** Where it shows, after waiting for its neighbours. */
  t: number;
  /** Where its spring puts it. */
  raw: number;
  /** Its spring's speed, per ms. */
  velocity: number;
  /** Its seen speed, per ms: not its spring's while it waits for a neighbour. */
  speed: number;
  /** When its spring starts, in ms. Later than now while it waits its turn. */
  start: number;
  /** The side a stiff leaf turned round mid-air heads for once the page in its way clears; until then it carries on. */
  due: 0 | 1 | null;
  spring: ReturnType<typeof solveSpring> | null;
  /** How far a released corner was from the free path, and over what distance that fades. */
  offset: Point;
  span: number;
}

const POSITION_REST = 5e-4;
const VELOCITY_REST = 1e-5;
/** How quickly a released page loses speed, per ms, when judging where it would land. */
const THROW_RATE = 0.994;
/** How far a leaf that may not turn gives under a pull, in page widths. */
const GIVE = 0.3;
/**
 * How far over a page must be before the stiff leaf behind it lifts. A page's crease reaches the spine only as it
 * lands, and a stiff leaf is hinged there, so until then the page lies across the stiff leaf's way.
 */
const HOLD = 0.96;
/** How far over a stiff leaf must be before the page behind it lifts: all but down as the page crosses the spine. */
const LEAD = 0.8;
/** How long a stiff leaf takes to get that far, as a share of its spring's period. */
const LEAD_TIME = 0.48;

/**
 * How far a leaf may have gone when the leaf ahead of it has gone `ahead` and must be `hold` of the way before it
 * stirs. It lies still until then, follows, and is free just as the leaf ahead comes to rest.
 */
function gate(ahead: number, hold: number) {
  const over = (ahead - hold) / (1 - POSITION_REST - hold);
  return Math.min(1, Math.max(0, over)) ** 2;
}

/** The inverse: how far the leaf ahead must have gone for the one behind it to have gone `gone`. */
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
  /** When the leaves were last moved, in ms. */
  let stepped = -Infinity;

  const active: Leaf[] = [];
  const under: Under = { left: turned - 1, right: turned };

  /** Leaves that changed side unseen, hidden by the leaves turning around them. In neither pile until motion ends. */
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

  /** Works out which resting page tops each pile. */
  function rebase() {
    if (active.length === 0) unseen.clear();
    let left = turned - 1;
    while (left >= 0 && !resting(left)) left--;
    let right = turned;
    while (right < leafCount && !resting(right)) right++;
    under.left = left;
    under.right = right;
  }

  /** The side a leaf lying at `t` (0 right, 1 left) lifts from. */
  function sideFor(t: number): Side {
    return t === 1 && turnBack === 'mirror' ? 'left' : 'right';
  }

  /** Sends a leaf to `target` from where it is seen, at its seen speed: a leaf held back isn't where its spring is. */
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
    // A page gives the stiff leaf ahead of it time to get out of its way.
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

  /**
   * How far `leaf` may have gone when `other`, the leaf ahead of it, has gone `ahead`. `was` is how far it had gone
   * a moment ago. All three count from the side the leaves are leaving.
   */
  function room(leaf: Leaf, other: Leaf, ahead: number, was: number) {
    const hard = stiff(leaf.index);
    // Two pages, or two boards, need only keep their order.
    if (hard === stiff(other.index)) return ahead;
    // A leaf already further than it may be, after turning round mid-air, waits there: it is never sent back.
    return Math.min(ahead, Math.max(gate(ahead, hard ? HOLD : LEAD), was));
  }

  /** Whether a stiff leaf sent to `target` now would have to hang until the page it must follow has all but landed. */
  function barred(leaf: Leaf, target: 0 | 1) {
    if (!stiff(leaf.index)) return false;
    const other = active[active.indexOf(leaf) + (target === 1 ? -1 : 1)];
    if (!other || stiff(other.index)) return false;
    const gone = target === 1 ? leaf.t : 1 - leaf.t;
    const ahead = target === 1 ? other.t : 1 - other.t;
    return gone > gate(ahead, HOLD);
  }

  /**
   * A leaf turned round at speed swings back a little, but not through what has come up behind it: a stiff leaf
   * behind a page, a page behind a stiff leaf, or a leaf heading the other way. So it and the leaves ahead of it stop
   * where the one behind lets them. Only a leaf that was clear is kept clear; otherwise the leaf behind waits for it.
   */
  function pin(target: 0 | 1, was: readonly number[]) {
    const ahead = target === 1 ? -1 : 1;
    /** How far a leaf at `t` has gone towards `target`. */
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
        // Each keeps to its own half of the gap between them.
        const other = gone(was[at - ahead]!);
        if (other <= before) least = Math.max(least, (before + other) / 2);
        // And a page stays clear of a stiff leaf behind it whichever way that is going.
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

  /** Leaves can't pass through each other: each waits for the one it lies against. */
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

  /**
   * Bounds the leaves in the air. A leaf still waiting to lift is hidden by those around it and can turn unseen, so
   * those go first; only then is the leaf nearest to landing put down early.
   */
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

  /** Asks for `next` leaves on the left. Leaves in the air turn round where they are; resting leaves lift in turn. */
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

    // A long jump riffles: the first and last few leaves turn, the rest turn unseen.
    const head = Math.ceil(maxActive / 2);
    const tail = lifting.length - (maxActive - head);
    lifting.forEach((index, position) => {
      if (lifting.length > maxActive && position >= head && position < tail) unseen.add(index);
      else launch(index, target, now, corner);
    });

    turned = next;

    // The pages that end up on top must be seen to arrive.
    if (unseen.delete(turned - 1)) launch(turned - 1, 1, now, corner);
    if (unseen.delete(turned)) launch(turned, 0, now, corner);

    sort();
    limit(now);
    rebase();
  }

  /** Moves every leaf to where it is at `now`. Returns whether any still move on their own. */
  function step(now: number) {
    for (const leaf of active) {
      // A stiff leaf that carried on turns round as soon as its way is clear.
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
      // A leaf held back goes on from where it is when let go, not from where its spring got to without it.
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
        // It got to the side it was leaving for, and sets off again from there.
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

  /** Picks up the top resting leaf of a pile by `corner`. Returns its index, or -1 when that pile is empty. */
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
      // Past the limit a leaf lifts and falls back, so the end of the book can be felt.
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

  /** Moves a held leaf's corner to `point`, in page units. */
  function drag(index: number, point: Point) {
    const leaf = find(index);
    if (!leaf?.held) return;
    leaf.point = constrain(leaf.bound ? resist(point, leaf) : point, leaf.corner, aspect);
    leaf.t = progressOf(leaf.point);
  }

  /** A leaf that may not turn follows a pull less the further it is pulled. */
  function resist(point: Point, leaf: Leaf): Point {
    const rest = home(leaf.corner, aspect, leaf.from);
    const dx = point.x - rest.x;
    const dy = point.y - rest.y;
    const pulled = Math.hypot(dx, dy);
    if (pulled === 0) return rest;
    const shown = rubberBand(pulled, GIVE) / pulled;
    return { x: rest.x + dx * shown, y: rest.y + dy * shown };
  }

  /**
   * Lets go of a held leaf: a slow release settles on the nearer side, a flick carries it the way it was thrown.
   * `velocityX` is the pointer's speed, in page widths per ms. `trailing` is for a corner still catching up: the leaf
   * lands where the pointer would have taken it, at the speed it was seen to have. Returns the leaves now on the left.
   */
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

  /** Puts every leaf where it belongs at once, with no motion. */
  function jump(next: number) {
    turned = clampTurned(next);
    active.length = 0;
    lastLaunch = -Infinity;
    rebase();
  }

  return {
    /** Leaves in the air, waiting, or held, in pile order. Read after `step`. */
    active: active as readonly ActiveLeaf[],
    under: under as Readonly<Under>,
    get turned() {
      return turned;
    },
    get leafCount() {
      return leafCount;
    },
    /** Changes how many leaves there are and how many may turn, and puts `next` on the left. */
    setLeaves(count: number, limit = count, next = turned) {
      leafCount = Math.max(0, count);
      limitTurned = Math.min(leafCount, Math.max(0, limit));
      jump(next);
    },
    setAspect(value: number) {
      aspect = value;
    },
    /** Changes the most leaves in the air at once, for the turns asked for from now on. */
    setMaxActive(value: number) {
      maxActive = Math.max(2, Math.round(value));
    },
    /** Changes how leaves turn back. Leaves already in the air keep the way they lifted. */
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
