import { solveSpring } from '@ui-sdk/core/gesture';

import type { Point } from './fold';
import type { Under } from './turns';

/**
 * A ribbon bookmark: sewn in at the head of the spine, lying down the gutter of the pages it marks, its tail
 * hanging out below. Under other pages only the tail shows, and only the tail can be taken.
 * No gravity: the book is seen from above, so the ribbon lies where it is left. It is a string of short joints
 * that is only ever pulled: a point further from the one before it than their joint is long moves straight
 * towards it, just far enough. Nothing corrects it afterwards (no bend limit, no loop removal): such rules pull
 * against each other. What cloth does that a string doesn't is in the drawing: see `layOf`.
 * Lengths are in page widths from the top of the spine, x across the right-hand page and y down it.
 */

/** A length of cloth to draw, lying flat. */
interface Strip {
  /** Where its middle runs: x then y, one pair after another. Read it, don't keep it. */
  points: Float64Array;
  count: number;
  width: number;
  /** A CSS colour. */
  colour: string;
  /** How much of it shows, from 0 to 1. */
  opacity: number;
  /** Leaves lying before the pages it marks, and its side of the spine: together they say which leaves are over it. */
  gap: number;
  side: -1 | 1;
  /** Which of its points a hand has it by, or last had it by. */
  held: number;
  /** How far the hand has lifted it there, from 0 to 1. */
  lift: number;
  /**
   * How far along the whole cloth its first point is, in page widths: 0 where the cloth is made fast, more where
   * only the rest of it shows. And about how far apart its points are when it is drawn out.
   */
  from: number;
  joint: number;
}

/** How the book stands, which says where its ribbon is. */
interface RibbonScene {
  /** Page height over page width. */
  h: number;
  /** Whether what lies left of the spine is in view: not beside a single page, unless the book shows it. */
  left: boolean;
  leafCount: number;
  under: Under;
  turned: number;
  /** Whether leaves are turning. A corner lifted to show it can be isn't one. */
  turning: boolean;
  /** Whether nothing may move by itself: less motion was asked for. */
  still: boolean;
}

/** How wide the ribbon is, and how far from the spine its middle lies. */
const RIBBON_WIDTH = 0.032;
const RIBBON_AT = 0.022;
/** How much of it hangs out below the pages. */
const RIBBON_TAIL = 0.15;
/** How much of it, from the head of the spine, is sewn down, so it always leaves the spine straight down the gutter. */
const SEWN = 0.045;
/** About how long a joint is. Short enough to round its tightest bend in steps; the drawn curve is smooth anyway. */
const JOINT = 0.008;
/** The longest a frame is taken to have lasted, in ms. */
const SLOWEST = 50;
/** How far a hand may move the ribbon at a time, in joints. Further goes in several moves. */
const MOVE = 0.5;
/** The most moves made in one frame. A faster hand takes longer strides. */
const MOVES = 240;
/**
 * How much of its speed a ribbon let go keeps each 120th of a second. It lies still within about a second, a
 * fifth of a page width on for each page width per second it was going.
 */
const KEEP = 0.96;
/** Speed, in page widths per second, below which a ribbon let go has stopped: a pixel or two of its way is left. */
const STOPPED = 0.04;
/**
 * How much of its speed each part keeps, each 120th of a second, while it is carried about: it swings on round a
 * turn and rests a moment after the hand does. And the fastest any part goes on by itself, in page widths per second.
 */
const WEIGHT = 0.86;
const FASTEST = 4;
/** How long it swings on at a time, in ms, and how far round the leading point it may swing then, in radians. */
const SWINGS = 8;
const ROUND_LEAD = 0.12;
/** How much of its length swinging on may gather up at a time before it is taken to have gone wrong. */
const GATHER = 0.001;
/** The fastest it can be thrown, in page widths per second. */
const THROW = 4;
/**
 * How a ribbon leaves the pages it marked: it is drawn up along itself into where it comes from over `ms`, by its
 * length and `past` more, so its end is well out of sight. It first gives `dip` page widths the other way.
 */
const RISE = { ms: 220, dip: 0.014, past: 0.02 };
/**
 * How it comes to its new pages: it drops down their gutter from the head of the spine on a spring of this `period`
 * (seconds) and `damping`, so it falls a little past its length and comes back. `start` is how much of it is out at
 * first, `ms` how long before nothing of that is left to see. It sways as it falls: a wave runs down it, `sway` page
 * widths wide at its end, none at the head, `waves` of them along it, each passing in `beat` ms, dying over `dies` ms.
 */
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
/** How far below the pages a tail's middle stays, in page widths, with pages on the rest: clear of the book's edge. */
const CLEAR = 0.02;
/** The spring that drops a ribbon into place: how far short of its length it is, `t` ms after it began to drop. */
const FALL = solveSpring(DROP.period, DROP.damping, DROP.start - 1, 0);
/** How much of its length the ribbon can be pulled out to by hand, and how much it is drawn out to down the gutter. */
const TAUT = 0.985;
const DRAWN = 0.998;
/** Below this speed, in page widths per second, the ribbon is taken to be at rest. */
const REST = 0.02;
/** How far down the page, as a share of its height, a hand must let go for the ribbon to be drawn down the gutter. */
const LOW = 2 / 3;
/**
 * How long the ribbon takes to be drawn down the gutter, in ms: `least`, plus `each` per page width its end has to
 * go, capped at `most`, plus up to `flung` for one that was flung. `SETTLE` is how long its last bends take to go.
 */
const DRAW = { least: 240, each: 150, most: 620, flung: 240 };
const SETTLE = 160;
/** Speed, in page widths per second, at which a ribbon let go counts as flung and sets off the way it was going. */
const FLUNG = 1.2;
/** How long the end past the hand takes to come into line, in ms, and the most out of line it may be, in radians. */
const SWING = 60;
const ASKEW = 0.35;
/** How much of the ribbon before the hand says which way it runs there. */
const RUN = 0.03;
/** How long the ribbon takes to lift into a hand, and to lie down out of one, in ms. */
const LIFT = { up: 45, down: 75 };

/** Whether a piece of leaf `index` lying on `lies` side of the spine is over a ribbon. */
function overRibbon(strip: Strip, index: number, lies: -1 | 1) {
  if (lies !== strip.side) return false;
  return lies === 1 ? index < strip.gap : index >= strip.gap;
}

/** How many numbers say where a laid strip is at one place along it. */
const PLACE = 9;
/** How finely a strip is drawn, in page widths: cloth has body, so nothing smaller than about this shows in its run. */
const FAIR = 0.02;
/**
 * Where a strip is made fast it comes away in a long curve, never at a hinge: it is drawn only as finely as `fair`
 * there. That comes on over the first `rise` along it, in page widths, holds as far as `hold`, and is gone by `gone`.
 */
const ROOT = { fair: 0.055, rise: 0.09, hold: 0.11, gone: 0.42 };
/** How far along a strip made fast it is drawn just where it lies: what is sewn down doesn't move. */
const FIXED = 0.03;
/** How far either side of a place, in strip widths, the way a strip turns there is taken from. */
const TWIST = 0.75;
/**
 * How far it looks banked over round its tightest turns, and how far it must turn over the stretch its turning is
 * taken from to begin to bank and to bank that far, all in radians. Only the light shows it: it is drawn no narrower.
 */
const BANKS = { most: 0.9, from: 0.3, to: 1.6 };
/**
 * Round a turn that leaves less than `from` clear inside it, in page widths, the inner edge is drawn in towards the
 * middle of the round, and right to the middle with less than `to`: a ring that small shows no hole.
 */
const CLOSES = { from: 0.008, to: 0.003 };
/**
 * The furthest a strip turns between one place and the next, in radians. A sharper turn at a point gets places
 * enough there to take it round: the outer edge goes round the point, the inner edge stays on it.
 */
const ROUND = 0.35;
/** How far either side of the hand a strip is lifted, in page widths along it. */
const LIFTED = 0.22;

/**
 * A strip worked out for drawing: where its two edges run, and how it lies there. Drawn as a broad pen draws a
 * line: full width all along, round on the outside of a sharp turn, its inner edge never past the middle of the
 * turn. One rule however it lies: nothing changes at a stroke, its edges never cross. Both sides are the same cloth.
 */
interface Laid {
  /**
   * Per place: left edge (x then y), right edge, middle, distance along the strip, bank in radians (to either
   * side), and lift by a hand from 0 to 1. An edge is half the width from the middle, less inside a sharp turn.
   */
  places: Float64Array;
  /** The first place and the last of each stretch to draw as one. There is one stretch. */
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

/** How finely a strip is drawn at a point `along` it from where the whole of it is made fast. */
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

/**
 * Lays a strip out for drawing. `slant` cuts its far end at an angle: one edge runs on that many strip widths, the
 * other stops as far short. Pass `out` to have it written there. Each point is drawn towards the middle of its
 * neighbours, over and over, which rounds off whatever is smaller than cloth can show; then each two points get a
 * place between them, on the curve through them, so the edges go round a bend and not in straight pieces.
 */
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

  // Its line, run straight up before the first point (sewn down, or between pages) and straight on past the last.
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
    // Each pass rounds off half a joint's worth, squared.
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

  // Its middle: each point, and between each two a point on the curve through them and their neighbours.
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

  // Distance along, and turn in radians, at each place. Coincident places turn as one: the last stands for all.
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

  // Which way it turns at each place, and how far, over a stretch either side: a turn one way then back cancels out.
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

  // How many places that takes: one for each, and more where the line turns sharply at one.
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
  /** How much further along the places are than the line: round a sharp turn they go as far as the cloth's middle. */
  let extra = 0;
  for (let step = 0; step <= steps; step++) {
    const reach = reaches[step]!;
    const turn = turns[step]!;
    const way = ways[step]!;
    const roll =
      BANKS.most *
      smooth((Math.abs(way) - BANKS.from) / (BANKS.to - BANKS.from)) *
      (way < 0 ? -1 : 1);

    // The inner edge never crosses back over itself: it reaches no further in than the middle of the round the strip
    // turns in. Where a turn leaves next to nothing clear it is drawn in to the middle, so no speck of a hole shows.
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

    /** Writes a place where the strip runs (`tx`, `ty`)'s way and reaches `left` and `right` from its middle. */
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

    // Which way it comes to this place, and goes on from it, past any places that lie on this one.
    let before = Math.max(0, step - 1);
    let after = Math.min(steps, step + 1);
    while (before > 0 && apart(before, step) < 1e-9) before--;
    while (after < steps && apart(after, step) < 1e-9) after++;
    if (Math.abs(turn) > ROUND && before < step && after > step) {
      // A sharp turn: round the point, a little at a time.
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
    // Where it comes back on itself it runs no way at all, and has no width to show it.
    tx = length > 1e-9 ? tx / length : 0;
    ty = length > 1e-9 ? ty / length : 0;
    write(tx, ty, way > 0 ? inner : half, way > 0 ? half : inner);
  }
  out.runs.push(0, place - 1);

  return out;
}

/** Makes a ribbon. `joint` is about how long each of its joints is, in page widths. */
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
  /** Where each point is, x then y, and how far along the ribbon it is at its full length. */
  let points = new Float64Array(0);
  let lengths = new Float64Array(0);
  /** Where each point was when the last frame ended, and how fast it was going then. */
  let before = new Float64Array(0);
  let speeds = new Float64Array(0);
  let count = 0;
  let made = NaN;
  let side: -1 | 1 = 1;
  /** Where the ribbon comes out of the spine. It crosses the gutter with the ribbon. */
  let head = NaN;
  let exposed = false;
  /**
   * How it lies: `neat` down the gutter, `loose` where it was left, `drawn` down the gutter by its end, `settling`
   * its last bends there, `rising` out of the pages it marked, or `laid`: dropping down the gutter of its new pages.
   */
  let lies: 'neat' | 'loose' | 'drawn' | 'settling' | 'rising' | 'laid' = 'neat';
  /** When that began and, for `drawn` and `settling`, where its end, or all of it, was then. */
  let since = NaN;
  let from: Point = { x: 0, y: 0 };
  let length = 0;
  /** How much of a flung ribbon it was when it began to be drawn down the gutter, from 0 to 1. */
  let flung = 0;
  let shape = new Float64Array(0);
  /** How much of its length it has while it drops into place: a little over all of it as it springs back. */
  let grown = 1;
  /** How far to one side each point of it has swayed as it drops, for a point at its end. */
  let sway = 0;
  let wave = 0;
  /** How many leaves lie before the pages it is rising out of, and the first of its points that showed there. */
  let left = 0;
  let root = 0;
  let held = -1;
  /** Where the hand is. The ribbon can't always follow. */
  let hand: Point = { x: 0, y: 0 };
  /** Which way the end past the hand runs. */
  let swing = Math.PI / 2;
  /** The point it was last held by, and how far it is lifted there. */
  let lifted = -1;
  let lift = 0;
  /** The point that goes on a little way after it is let go, and how fast, in page widths per second. */
  let thrown = -1;
  let speed: Point = { x: 0, y: 0 };
  /** Where that point would be with nothing in tow. Carried towards here, it loses none of its way to what it draws. */
  let aim: Point = { x: 0, y: 0 };
  /** How far any point was moved by the last thing done to it. */
  let moved = 0;
  let last = NaN;
  let seen: RibbonScene | undefined;
  /** The first point of the tail: where the ribbon leaves the pages. */
  let exit = 0;

  /** How far down the gutter point `index` is when the ribbon lies there. */
  const down = (index: number) => lengths[index]! * grown;

  const put = (index: number, x: number, y: number) => {
    points[index * 2] = x;
    points[index * 2 + 1] = y;
  };

  /** Lays the ribbon down the gutter, at rest. */
  function straight() {
    grown = 1;
    sway = 0;
    for (let index = 0; index < count; index++) put(index, head, down(index));
    lies = 'neat';
    thrown = -1;
  }

  /** The last point of it that can't move: sewn down, or still between the pages. */
  function first() {
    if (!exposed) return exit;
    let index = 0;
    while (index < exit && lengths[index + 1]! <= SEWN) index++;
    return index;
  }

  /** The first point of it that shows: all of it in the open, and only its tail under pages. */
  const shows = () => (exposed ? 0 : exit);

  /**
   * Lets every point between `fast` and `lead`, the point the rest is drawn after, go on the way it was going, a
   * little slower. No point goes on towards the one that draws it, only across: what goes on is the swing round a
   * turn, never a push from behind, so nothing is gathered up or crumpled.
   */
  function swingOn(lead: number, fast: number, ms: number) {
    if (ms <= 0) return;
    const kept = WEIGHT ** (ms / (1000 / 120));
    // Neighbours go on together, between their speeds: each on its own would shake the ribbon into joint-long ripples.
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
    // A little at a time, so a slow frame swings it no differently from fast ones.
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
        // How far it was from the one that draws it: it stays that far, so it can only swing round it.
        const gap = Math.hypot(shape[at]! - shape[at + 2]!, shape[at + 1]! - shape[at + 3]!);
        let vx = speeds[at]! * kept;
        let vy = speeds[at + 1]! * kept;
        // Towards the one that draws it, it has nowhere to go.
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
          // No faster than it may, nor further round the leading point at a time: right behind that it hardly swings.
          const most = Math.min(FASTEST * each, ROUND_LEAD * (lengths[lead]! - lengths[index]!));
          const scale = Math.min(1, most / (fastness * each));
          x += vx * scale * each;
          y += vy * scale * each;
          swung = true;
        }
        const ox = x - points[at + 2]!;
        const oy = y - points[at + 3]!;
        const off = Math.hypot(ox, oy);
        // What swings keeps its distance from the one that draws it. What doesn't is only drawn after it, as ever.
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
      // Whatever that drew out too far from where it is fast comes back.
      follow(fast, lead, true);
      // Swinging on may leave it slack where it is fast, but not gather it up: if it would, it stays as it was.
      if (reach() < was - GATHER * (lengths[lead]! - lengths[fast]!)) {
        points.set(shape);
        speeds.fill(0);
        break;
      }
    }
  }

  /**
   * Draws each point after `start`, as far as `end`, after the one before it, if that has gone further off than
   * their joint is long. It stops at the first that needn't move, since nothing past it was pulled, and returns it;
   * with `all` it goes on to the end, for a ribbon whose points have moved by themselves.
   */
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

  /**
   * Takes point `index` to a place, a little at a time, and the rest of the ribbon after it. `fast` is the last
   * point that can't move. Points past `index` go in a line along `swing` if `stiff`, and are drawn after it if not.
   */
  function carry(index: number, x: number, y: number, fast: number, stiff: boolean) {
    const end = count - 1;
    const fx = points[index * 2]!;
    const fy = points[index * 2 + 1]!;
    const stride = MOVE * (lengths[end]! / end) * grown;
    const moves = Math.max(1, Math.min(MOVES, Math.ceil(Math.hypot(x - fx, y - fy) / stride)));
    const a = index * 2;
    const b = a - 2;
    const reach = down(index) - down(index - 1);
    /** Brings the point being carried back to within reach of the one before it. */
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
      // Each end pulls the ribbon its way in turn until it reaches between them.
      for (let pass = 0; pass < 4; pass++) {
        follow(index, fast + 1);
        follow(fast, index);
        const dx = points[a]! - points[b]!;
        const dy = points[a + 1]! - points[b + 1]!;
        if (Math.hypot(dx, dy) <= reach + 1e-9) break;
      }
      // What is fast has the last word: the hand gives by as much as the ribbon is still short, and comes on next time.
      give();
      trail(index, stiff);
    }
  }

  /** Brings what is past point `index` after it: in a line along `swing` if `stiff`, drawn after it if not. */
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

  /**
   * Begins drawing it down the gutter from where it lies: at `now`, or with the next frame if that isn't known.
   * `going` keeps the speed a hand let it go at, so it swings out the way it was going as it comes.
   */
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

  /**
   * Keeps a tail on the table when other pages lie on the rest of the ribbon: no point of it comes up over the
   * book. Each is put no higher than it may be, which only brings points nearer each other, so nothing stretches.
   */
  function clear() {
    if (exposed) return;
    for (let index = exit + 1; index < count; index++) {
      const least = made + Math.min(CLEAR, down(index) - down(exit));
      if (points[index * 2 + 1]! < least) points[index * 2 + 1] = least;
    }
  }

  /** Where the cloth that is `along` the ribbon lay, in `shape`, into `out`. Past its end it runs straight on. */
  function layAt(along: number, out: Point) {
    const end = count - 1;
    if (along >= lengths[end]!) {
      // The way its last stretch ran, or straight down if that says nothing.
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

  /** Moves the ribbon on to `now`; `gap` leaves lie before the pages it marks. Returns whether it still moves. */
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
    // A late frame counts for no more than a slow one: nothing leaps.
    const ms = Number.isNaN(last) ? 0 : Math.min(SLOWEST, Math.max(0, now - last));
    last = now;
    seen = scene;
    moved = 0;
    // Whatever was begun between frames begins now.
    if (Number.isNaN(since) && lies !== 'neat' && lies !== 'loose') since = now;

    // Drawn up out of the pages it marked: it is now with the ones it marks, about to drop.
    let landed = false;
    if (lies === 'rising' && (scene.still || now - since >= RISE.ms)) {
      lies = 'laid';
      since = now;
      landed = true;
    }
    // Until then it is still where it was.
    const here = lies === 'rising' ? left : gap;

    strip.gap = here;
    strip.opacity = scene.leafCount > 1 ? 1 : 0;
    const was = exposed;
    const { left: onLeft, right: onRight } = scene.under;
    // It lies between two leaves, on the side one of them lies on: the left-hand one if it can be. While both are in
    // the air it stays on the side it was, unless nothing of the book is left there and something is on the other.
    const bare = { left: onLeft < 0, right: onRight >= scene.leafCount };
    if (!scene.left) side = 1;
    else if (onLeft >= here - 1) side = -1;
    else if (onRight <= here) side = 1;
    else if (bare.left !== bare.right) side = bare.right ? -1 : 1;
    strip.side = side;
    // It shows only where it has its own page to lie on, with the other one off it.
    exposed = side === -1 ? onLeft === here - 1 : onRight === here;

    const home = side * RIBBON_AT;
    const fresh = Number.isNaN(head);
    // Its tail crosses the gutter as the rest of it does: it never leaps from one side to the other.
    if (fresh || scene.still || landed) {
      head = home;
      if (fresh) straight();
    } else {
      head += (home - head) * (1 - Math.exp(-ms / 50));
      if (Math.abs(home - head) < 1e-4) head = home;
    }

    // Pages turning sweep a loose ribbon into the gutter, and take it out of a hand.
    if (scene.turning && (held >= 0 || lies === 'loose')) {
      held = -1;
      draw(now);
    }

    grown = 1;
    sway = 0;
    /** Whether it is out of sight, waiting for its pages to open before it drops. */
    let waits = false;
    if (lies === 'laid') {
      // It drops into pages that lie open: while they are still turning, it waits.
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
    // A tail left loose on the table lies there only while pages lie on the rest of it.
    if (was !== exposed && held < 0 && lies === 'loose') straight();

    const end = count - 1;
    if (lies === 'drawn' && now - since >= length) {
      // Its end is home. What bends it has left go next.
      lies = 'settling';
      since = now;
      shape.set(points);
    }
    if (lies === 'settling' && now - since >= SETTLE) lies = 'neat';

    // Under the pages it can't move, and neither can what is sewn down.
    const fast = first();
    /** The first of its points to draw. */
    let shown = shows();
    if (lies === 'rising') {
      // Drawn up along itself into where it comes from: every point goes the way the cloth before it lay.
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
      // Nothing of it shows until its pages are open.
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
      // Let go moving, it is drawn in from further and further the way it was going, until that is spent.
      if (Math.hypot(speed.x, speed.y) > STOPPED && !scene.still) {
        from = { x: from.x + (speed.x * ms) / 1000, y: from.y + (speed.y * ms) / 1000 };
        const kept = KEEP ** (ms / (1000 / 120));
        speed = { x: speed.x * kept, y: speed.y * kept };
      }
      // Drawn out by its end, not quite to its full length: there is nothing to pull against.
      // From rest it sets off at once. Flung, it sets off the way it was going and comes round.
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
        // What holds it fast may have moved, and it goes on a little way from the hand that let it go.
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
          // Drawn tight, it has no further out to go. What speed it has left takes it round.
          const out = far > reach ? (speed.x * dx + speed.y * dy) / far : 0;
          if (out > 0) speed = { x: speed.x - (out * dx) / far, y: speed.y - (out * dy) / far };
          aim = { x: tx, y: ty };
          // The end past where the hand had it goes with it, as it lies: it was thrown too.
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
          // What was thrown has stopped, and the rest after it. If that is low on the page, it is as if let go there.
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

    // How fast each point went, for what it does next. Laid in its place, it has no speed.
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

  /** Carries the ribbon where the hand has it, and the end past the hand in line with what comes before it. */
  function grip(ms: number, fast: number) {
    // Fast at the spine or where pages lie on it. Short of full length: pulled dead straight it has nowhere to give.
    const ax = points[fast * 2]!;
    const ay = points[fast * 2 + 1]!;
    // But it is never drawn back from where it is: taken where it lies at its full length, it stays there.
    const full = down(held) - down(fast);
    const reach = Math.max(
      full * TAUT,
      Math.min(full, Math.hypot(points[held * 2]! - ax, points[held * 2 + 1]! - ay)),
    );
    // A tail whose ribbon is under other pages goes about on the table below them, as far up as their edge.
    const dx = hand.x - ax;
    const dy = (exposed ? hand.y : Math.max(hand.y, made + CLEAR)) - ay;
    const far = Math.hypot(dx, dy);
    const scale = far > reach ? reach / far : 1;

    // Fingers hold a ribbon flat between them, so it leaves them the way it came, once it has come round.
    let back = held;
    while (back > fast && down(held) - down(back) < RUN) back--;
    const rx = points[held * 2]! - points[back * 2]!;
    const ry = points[held * 2 + 1]! - points[back * 2 + 1]!;
    // Folded over behind the hand, its direction says nothing.
    if (back < held && Math.hypot(rx, ry) > 0.3 * (down(held) - down(back))) {
      let turn = Math.atan2(ry, rx) - swing;
      turn -= Math.round(turn / (2 * Math.PI)) * 2 * Math.PI;
      // It comes round smoothly, but is never left far out of line, however few frames there are to bring it.
      const left = turn * Math.exp(-ms / SWING);
      swing += turn - Math.sign(left) * Math.min(Math.abs(left), ASKEW);
    }
    carry(held, ax + dx * scale, ay + dy * scale, fast, true);
  }

  /** Moves the ribbon to the pages `step` is next told of: drawn up from where it lies, it drops down their gutter. */
  function lay(now: number) {
    if (count === 0 || Number.isNaN(head)) return;
    held = -1;
    thrown = -1;
    // Already on its way up, it goes on.
    if (lies === 'rising') return;
    lies = 'rising';
    since = now;
    left = strip.gap;
    root = shows();
    // Still out of sight, waiting to drop, there is nothing of it to draw up.
    if (strip.count < 2) since = now - RISE.ms;
    shape.set(points);
  }

  /** Takes hold of the ribbon's tail where `point` is nearest it. */
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
    // The end past the hand starts out the way it lies.
    const end = count - 1;
    const ex = points[end * 2]! - points[held * 2]!;
    const ey = points[end * 2 + 1]! - points[held * 2 + 1]!;
    swing = Math.hypot(ex, ey) > 1e-6 ? Math.atan2(ey, ex) : Math.PI / 2;
    pull(point);
  }

  /** Pulls the ribbon to where `point` is, as far as it reaches. It gets there with the next `step`. */
  function pull(point: Point) {
    if (held < 0) return;
    hand = point;
  }

  /**
   * Lets go of the ribbon, moving at `velocity` page widths per second. Low on the page it is drawn down the gutter
   * and this returns true. Higher, it goes on the way it was going and slows: it lies where it stops, or is drawn
   * down from there if that is low on the page. A tail under other pages is always drawn back to hang below them.
   */
  function release(velocity: Point) {
    if (held < 0) return false;
    // It is let go where the hand is now, not where the last frame left it.
    grip(0, first());
    // Cloth this light can't be thrown far.
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

  /** Puts the ribbon back down the gutter. */
  function back() {
    held = -1;
    if (seen?.still) {
      // With nothing to show of its going, it is simply back.
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
    /** Whether the pages it lies in are open, so the whole of it shows. */
    get exposed() {
      return exposed;
    },
    /** Whether it lies down the gutter, with nothing more to do. */
    get neat() {
      return lies === 'neat';
    },
    /** The box around its tail: left, top, right, bottom. */
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
    /** Forgets how long it is since it last moved, so a ribbon left alone doesn't leap when it wakes. */
    wake() {
      last = NaN;
    },
  };
}

type Ribbon = ReturnType<typeof createRibbon>;

export { createRibbon, layOf, overRibbon, PLACE, RIBBON_AT, RIBBON_TAIL, RIBBON_WIDTH };
export type { Laid, Ribbon, RibbonScene, Strip };
