import { bindDrag } from '@ui-sdk/core';
import { createVelocityTracker, solveSpring } from '@ui-sdk/core/gesture';

import { cornerPath, progressOf, type Corner, type Point, type Side, type TurnBack } from '../core';
import { reducedMotion, type Scene } from './scene';
import type { Scroller } from './scroller';
import type { BookState } from './state';
import { createSteady } from './steady';

/** Turning pages by hand: the drag and the peek. The pointer is tracked in page widths from the top of the spine. */

/** A drag starts once the pointer has moved this far, in px. */
const SLOP = 6;
/** With a mouse, a drag starts only this close to a page's outer edge, in page widths. */
const EDGE = 0.18;
/** How far a drag travels, in page widths, before the corner is fully under the pointer. */
const CATCH_UP = 0.35;
/**
 * And the least time that takes, in ms. A swipe covers that distance in a frame or two, and a single page is
 * taken hold of anywhere on it, half a turn from its corner: without this the leaf would be half over at once.
 */
const CATCH_TIME = 160;
/**
 * The quickest a held corner moves, in page widths per ms: about as quick as a leaf turns unheld. A swipe
 * across the page in a frame or two lifts the leaf and throws it; it doesn't carry it over unseen.
 */
const PACE = 0.008;
/** How long a corner takes to reach that pace from rest, in ms. */
const PACE_TIME = 120;
/** How far a finger goes before its swipe is taken to be one way or the other, in px. */
const HEADING = 3;
/** How far a corner is behind the pointer, in page widths, before it counts as trailing it. */
const BEHIND = 0.02;
/**
 * How far a corner lifts under a pointer, in page widths; how many times further under a finger, which would
 * hide it; and the least time it stays up under one, in ms, so a tap, over before it has risen, still shows it.
 */
const PEEK = { x: 0.09, y: 0.065, finger: 2.2, tap: 320 };

interface GesturesOptions {
  scene: Scene;
  /** The box the spread scrolls across in, where it is too wide for its room. */
  scroller: Scroller;
  state(): BookState;
  turnBack(): TurnBack;
  hard(leaf: number): boolean;
  locate(event: PointerEvent): Point;
  /** Starts drawing frames. A `quiet` start isn't a turn. */
  wake(quiet?: boolean): void;
  say(what: 'dragging' | 'peeking', is: boolean): void;
  /** Opens the book where a leaf was let go: with `turned` leaves on the left. */
  land(turned: number, event: PointerEvent): void;
  /** Turns the leaves back to where the book is open. */
  restore(): void;
  onDestroy(cleanup: () => void): void;
}

function createGestures({
  scene,
  scroller,
  state,
  turnBack,
  hard,
  locate,
  wake,
  say,
  land,
  restore,
  onDestroy,
}: GesturesOptions) {
  /** The corner the last drag took hold of, which the leaves that follow lift by. */
  let heading: Corner = 'bottom';

  const drag = {
    held: -1,
    /** Whether a press that may yet become a drag is being followed. */
    pressed: false,
    corner: 'bottom' as Corner,
    stiff: false,
    /** The pages a finger's swipe scrolls to and doesn't turn, as the press found the box: none, where nothing scrolls. */
    scrolls: undefined as Record<Side, boolean> | undefined,
    /**
     * Whether the page is held anywhere on it, its corner running ahead of the pointer: a single page, or the page
     * in view of a spread that scrolls. And how far that page's left edge is from the spine, in page widths.
     */
    loose: false,
    base: 0,
    /** Where on the page the pointer took hold, in page widths. */
    grip: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    /** Where the pointer has the corner, once the corner has caught up with it. */
    point: { x: 0, y: 0 },
    /** Where the corner is: no further on than its pace has let it get. */
    shown: { x: 0, y: 0 },
    /** How fast it got there, across the page, in page widths per ms. */
    speed: 0,
    /** When the leaf was taken hold of, in ms. */
    since: 0,
    travelled: 0,
    /** The share of `offset` the corner is still behind by: 1 at first, 0 once it has caught up. */
    lag: 1,
    /** When `lag` was last worked out, in ms. */
    seen: 0,
    tracker: createVelocityTracker(),
    /** Fills the frames between two places a slow pointer reports. */
    steady: createSteady(),
  };
  let stop: (() => void) | undefined;
  onDestroy(() => stop?.());

  /** The peek: a corner lifts a little to show it can be taken, under a mouse at a page's edge or a finger put down. */
  const peek = {
    index: -1,
    side: 'right' as Side,
    corner: 'bottom' as Corner,
    start: 0,
    /** How many times further than under a mouse it lifts. */
    far: 1,
    /** When a corner a finger has left is to fall, in ms. 0 while nothing has left it. */
    falls: 0,
    spring: null as ReturnType<typeof solveSpring> | null,

    /** The part of a page the pointer is over, if a corner there can lift. */
    zone(point: Point): { side: Side; corner: Corner } | undefined {
      const { drag: draggable, columns } = state();
      const { aspect } = scene;
      if (!draggable || reducedMotion()) return undefined;
      if (
        point.y < 0 ||
        point.y > aspect ||
        Math.abs(point.x) < 1 - EDGE ||
        Math.abs(point.x) > 1
      ) {
        return undefined;
      }
      const side: Side = point.x > 0 ? 'right' : 'left';
      // Played backward, a page comes away from the spine: there is no corner to lift.
      if (side === 'left' && (columns === 1 || turnBack() === 'reverse')) return undefined;
      return { side, corner: point.y > aspect / 2 ? 'bottom' : 'top' };
    },

    /** Follows a mouse: lifts the corner it is over and drops the one it left. */
    follow(event: PointerEvent) {
      if (event.pointerType === 'mouse') peek.raise(peek.zone(locate(event)));
    },

    /** Lifts the corner in `zone`, `far` times as far as under a mouse, and drops any other that was lifted. */
    raise(zone: { side: Side; corner: Corner } | undefined, far = 1) {
      const { turns } = scene;
      if (!turns) return;
      if (zone && peek.index >= 0 && zone.side === peek.side && zone.corner === peek.corner) {
        // Still wanted: one that was about to fall stays up.
        peek.falls = 0;
        return;
      }
      peek.drop();
      // Only a book at rest: a corner doesn't lift into leaves that are turning.
      if (!zone || turns.active.length > 0) return;
      turns.setTurnBack(turnBack());
      const index = turns.grab(zone.side, performance.now(), zone.corner);
      if (index < 0) return;
      peek.index = index;
      peek.side = zone.side;
      peek.corner = zone.corner;
      peek.far = far;
      peek.start = performance.now();
      peek.spring = solveSpring(0.35, 1, -1, 0);
      say('peeking', true);
      wake(true);
    },

    /** Moves the corner to where its spring has it. Returns whether it is still moving. */
    lift(time: number) {
      const { turns, aspect } = scene;
      if (peek.index >= 0 && peek.falls > 0 && time >= peek.falls) {
        peek.drop();
        return true;
      }
      // One that has risen and is waiting to fall has frames still to come.
      if (peek.index < 0 || !peek.spring || !turns) return peek.index >= 0 && peek.falls > 0;
      const elapsed = Math.max(0, time - peek.start);
      const amount = 1 + peek.spring.position(elapsed);
      const settled = elapsed > 0 && Math.abs(1 - amount) < 1e-3;
      const rest = { x: peek.side === 'right' ? 1 : -1, y: peek.corner === 'bottom' ? aspect : 0 };
      turns.drag(peek.index, {
        x: rest.x + (peek.side === 'right' ? -1 : 1) * PEEK.x * peek.far * amount,
        y: rest.y + (peek.corner === 'bottom' ? -1 : 1) * PEEK.y * peek.far * amount,
      });
      if (settled) peek.spring = null;
      return !settled || peek.falls > 0;
    },

    /** Lets the corner fall once it has been up long enough to be seen. */
    fall() {
      if (peek.index < 0) return;
      peek.falls = Math.max(performance.now(), peek.start + PEEK.tap);
      wake(true);
    },

    drop() {
      if (peek.index < 0) return;
      const index = peek.take();
      scene.turns?.release(index, performance.now());
      wake(true);
    },

    /** Hands the lifted leaf over, still held, to whoever asks. */
    take() {
      const index = peek.index;
      peek.index = -1;
      peek.falls = 0;
      peek.spring = null;
      if (index >= 0) say('peeking', false);
      return index;
    },
  };

  /**
   * Where a pointer at `point` puts the dragged corner. Across a spread, under the pointer. With one page in view
   * the corner runs ahead, so crossing the one page width turns it all the way; and as that page is held anywhere,
   * the corner keeps to the path it takes by itself, moved off it as the pointer moves up or down from its grip.
   */
  const cornerAt = (point: Point): Point => {
    if (!drag.loose) return point;
    const x = (point.x + drag.base) * 2 - 1;
    const free = cornerPath(progressOf({ x, y: 0 }), drag.corner, scene.aspect);
    return { x, y: free.y + (point.y - drag.grip.y) * 2 };
  };

  /** Takes hold of a leaf, if the press has turned out to be a pull on one. */
  const begin = (event: PointerEvent, from: { x: number; y: number; point: Point }) => {
    const { turns, aspect } = scene;
    if (!turns) return false;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    // A finger going up or down is scrolling. A mouse has pressed a page's edge, and whichever way it sets
    // off it has that page: up from a corner, or at a slant, as often as straight across.
    const mouse = event.pointerType === 'mouse';
    const across = Math.abs(dx) > Math.abs(dy);
    if (!mouse && !across) return false;

    // Across a spread the page under the pointer is taken. In one column the way it is pulled says which:
    // left takes this page, right brings the last one back. A mouse going up or down says it by the edge it pressed.
    // A spread that scrolls has one page in view, and a finger anywhere on it pulls the way of the page it is
    // after: that page comes into view, and is taken only once the box has no further to go.
    const { columns } = state();
    const placed: Side = from.point.x >= (columns === 2 ? 0 : 0.5) ? 'right' : 'left';
    const pulled: Side = dx < 0 ? 'right' : 'left';
    if (drag.scrolls?.[pulled]) return false;
    const side = (columns === 1 || drag.scrolls) && across ? pulled : placed;
    if (!mouse && side !== pulled) return false;

    drag.loose = columns === 1 || scroller.active;
    drag.base = columns === 2 && side === 'left' ? 1 : 0;

    // A corner already peeking under the pointer is the one taken. With one page in view the corner is only a guess
    // from the pointer's half: a leaf joining others in the air lifts by their corner, so they don't fold across.
    const joining = drag.loose && turns.active.length > (peek.index >= 0 ? 1 : 0);
    let corner: Corner = joining ? heading : from.point.y > aspect / 2 ? 'bottom' : 'top';
    let index = -1;
    let resting = { x: side === 'right' ? 1 : -1, y: corner === 'bottom' ? aspect : 0 };
    if (peek.index >= 0 && peek.side === side) {
      corner = peek.corner;
      index = peek.take();
      resting = turns.active.find((leaf) => leaf.index === index)?.point ?? resting;
    } else {
      peek.drop();
      turns.setTurnBack(turnBack());
      index = turns.grab(side, performance.now(), corner);
    }
    if (index < 0) return false;

    drag.held = index;
    drag.corner = corner;
    drag.stiff = hard(index);
    drag.grip = from.point;
    const start = cornerAt(from.point);
    drag.origin = start;
    drag.offset = { x: resting.x - start.x, y: resting.y - start.y };
    drag.point = start;
    drag.shown = { ...resting };
    drag.speed = 0;
    drag.travelled = 0;
    drag.lag = 1;
    drag.since = drag.seen = performance.now();
    drag.tracker.reset();
    drag.tracker.add(event.timeStamp, start.x);
    drag.steady.reset();
    heading = corner;
    say('dragging', true);
    wake();
    return true;
  };

  /** Where the pointer has the held corner, less what the corner is still behind by. */
  const wanted = (): Point => ({
    x: drag.point.x + drag.offset.x * drag.lag,
    y: drag.point.y + drag.offset.y * drag.lag,
  });

  const put = () => {
    const { turns, aspect } = scene;
    if (drag.held < 0 || !turns) return;
    const corner = drag.shown;
    // A stiff leaf swings rather than folds, so its edge is under the pointer
    // when it has swung through the angle whose cosine is the pointer's place.
    turns.drag(
      drag.held,
      drag.stiff
        ? {
            x: 1 - (2 * Math.acos(Math.min(1, Math.max(-1, corner.x)))) / Math.PI,
            y: drag.corner === 'bottom' ? aspect : 0,
          }
        : corner,
    );
  };

  const track = (event: PointerEvent) => {
    if (drag.held < 0 || !scene.turns) return;
    const point = cornerAt(locate(event));
    drag.travelled = Math.max(
      drag.travelled,
      Math.hypot(point.x - drag.origin.x, point.y - drag.origin.y),
    );
    drag.point = point;
    drag.tracker.add(event.timeStamp, point.x);
  };

  /** The quickest the held corner may be moving at `time`, in page widths per ms. */
  const pace = (time: number) => PACE * Math.min(1, Math.max(0, time - drag.since) / PACE_TIME);

  /**
   * The corner catches up with the pointer over distance under a slow hand and over time under a quick one, so
   * it never jumps, and no quicker than its pace. Called every frame: a stopped pointer still has a corner coming.
   */
  const follow = (time: number) => {
    if (drag.held < 0) return;
    const passed = Math.max(0, time - drag.seen);
    drag.seen = Math.max(drag.seen, time);
    const byDistance = Math.max(0, 1 - drag.travelled / CATCH_UP);
    drag.lag = Math.max(byDistance, drag.lag - passed / CATCH_TIME);
    const to = drag.steady.toward(drag.shown, wanted(), passed);
    const dx = to.x - drag.shown.x;
    const dy = to.y - drag.shown.y;
    const far = Math.hypot(dx, dy);
    const reach = pace(time) * passed;
    const part = far > reach ? reach / far : 1;
    drag.shown = { x: drag.shown.x + dx * part, y: drag.shown.y + dy * part };
    if (passed > 0) drag.speed = (dx * part) / passed;
    put();
  };

  const end = (event: PointerEvent, canceled: boolean) => {
    const { turns } = scene;
    drag.pressed = false;
    if (drag.held < 0 || !turns) {
      // A press that never became a drag leaves the corner as a mouse found it. A finger is gone, and its corner falls.
      if (event.pointerType === 'mouse') peek.follow(event);
      else peek.fall();
      return;
    }
    const index = drag.held;
    drag.held = -1;
    say('dragging', false);
    if (canceled) {
      // Escape, or the browser took the pointer for itself: the leaf goes back where it lay.
      turns.release(index, performance.now());
      wake();
      restore();
      return;
    }
    // A corner still coming up to the pointer goes on as fast as it was seen to move; one that is under it,
    // as fast as the pointer, less what is past the corner's pace.
    const now = performance.now();
    const velocity = drag.tracker.velocity(event.timeStamp);
    const behind = wanted().x - drag.shown.x;
    const most = pace(now);
    const turned = turns.release(index, now, velocity, {
      behind,
      velocityX: Math.abs(behind) > BEHIND ? drag.speed : Math.min(most, Math.max(-most, velocity)),
    });
    wake();
    land(turned, event);
  };

  /** The pages a swipe would scroll to, where the spread scrolls. */
  const reach = (): Record<Side, boolean> | undefined =>
    scroller.active
      ? { left: scroller.reaches('left'), right: scroller.reaches('right') }
      : undefined;

  /**
   * A finger on a spread that scrolls. The browser scrolls for any swipe unless it is told not to, as the swipe
   * sets off: so it is told for a swipe that has nowhere to scroll to, which turns a leaf or does nothing.
   */
  const finger = {
    id: -1,
    x: 0,
    y: 0,
    scrolls: undefined as Record<Side, boolean> | undefined,
    /** Whether the swipe is kept from the browser: not known until it has set off. */
    kept: undefined as boolean | undefined,
  };

  return {
    get held() {
      return drag.held >= 0;
    },
    get peeking() {
      return peek.index >= 0;
    },
    get heading() {
      return heading;
    },
    peek: { lift: peek.lift, drop: peek.drop, take: peek.take },
    follow,

    press(event: PointerEvent, el: HTMLElement | undefined) {
      const { columns, drag: draggable } = state();
      if (!el || !scene.turns || !draggable || drag.held >= 0 || drag.pressed) return;
      if (!event.isPrimary || event.button !== 0) return;
      const point = locate(event);
      // A mouse selects text in the middle of a page, so it turns pages by their outer
      // edges. A single page has two: its right edge, and its left to bring the last page back.
      const fromEdge = columns === 2 ? 1 - Math.abs(point.x) : Math.min(point.x, 1 - point.x);
      if (event.pointerType === 'mouse' && fromEdge > EDGE) return;
      const from = { x: event.clientX, y: event.clientY, point };
      drag.scrolls = event.pointerType === 'mouse' ? undefined : reach();
      drag.pressed = true;
      stop?.();
      stop = bindDrag(el, event, {
        threshold: SLOP,
        cancelOnEscape: true,
        onStart: (move) => {
          if (begin(move, from)) return true;
          // Not a pull on a page: a scroll, or nothing to take hold of.
          drag.pressed = false;
          if (move.pointerType !== 'mouse') peek.fall();
          return false;
        },
        onMove: ({ event: move }) => track(move),
        onEnd: end,
      });
      // A mouse has lifted the corner already, by being over it. A finger lifts it by coming down on it.
      if (event.pointerType !== 'mouse') peek.raise(peek.zone(point), PEEK.finger);
    },

    hover(event: PointerEvent) {
      if (!drag.pressed) peek.follow(event);
    },

    /** A mouse leaving the pages. A finger leaves them by lifting, and its corner falls in its own time. */
    leave(event: PointerEvent) {
      if (!drag.pressed && event.pointerType === 'mouse') peek.drop();
    },

    touch(event: TouchEvent) {
      const first = event.touches[0];
      // Two fingers are the browser's.
      finger.id = event.touches.length === 1 && first && state().drag ? first.identifier : -1;
      if (finger.id < 0 || !first) return;
      finger.x = first.clientX;
      finger.y = first.clientY;
      finger.scrolls = reach();
      finger.kept = undefined;
    },

    swipe(event: TouchEvent) {
      const moved = Array.from(event.touches).find((touch) => touch.identifier === finger.id);
      if (!moved || !finger.scrolls || event.touches.length !== 1) return;
      if (finger.kept === undefined) {
        const dx = moved.clientX - finger.x;
        const dy = moved.clientY - finger.y;
        // Not before it has gone far enough to say which way. The browser waits longer than this to scroll.
        if (Math.hypot(dx, dy) < HEADING) return;
        finger.kept = Math.abs(dx) > Math.abs(dy) && !finger.scrolls[dx < 0 ? 'right' : 'left'];
      }
      if ((finger.kept || drag.held >= 0) && event.cancelable) event.preventDefault();
    },

    /** Lets go of everything, when the pages unmount. */
    reset() {
      stop?.();
      stop = undefined;
      drag.pressed = false;
      drag.held = -1;
      peek.take();
    },
  };
}

type Gestures = ReturnType<typeof createGestures>;

export { createGestures };
export type { Gestures };
