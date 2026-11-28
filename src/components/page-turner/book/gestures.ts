import { bindDrag } from '@ui-sdk/core';
import { createVelocityTracker, solveSpring } from '@ui-sdk/core/gesture';

import { cornerPath, progressOf, type Corner, type Point, type Side, type TurnBack } from '../core';
import { reducedMotion, type Scene } from './scene';
import type { Scroller } from './scroller';
import type { BookState } from './state';
import { createSteady } from './steady';

const SLOP = 6;
const EDGE = 0.18;
const CATCH_UP = 0.35;
const CATCH_TIME = 160;
const PACE = 0.008;
const PACE_TIME = 120;
const HEADING = 3;
const LIFTED_CORNER_SLANT = 2;
const BEHIND = 0.02;
const PEEK = { x: 0.09, y: 0.065, finger: 2.2, tap: 320 };

interface GesturesOptions {
  scene: Scene;
  scroller: Scroller;
  state(): BookState;
  turnBack(): TurnBack;
  hard(leaf: number): boolean;
  locate(event: PointerEvent): Point;
  wake(quiet?: boolean): void;
  say(what: 'dragging' | 'peeking', is: boolean): void;
  land(turned: number, event: PointerEvent): void;
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
  let heading: Corner = 'bottom';

  const drag = {
    held: -1,
    pressed: false,
    corner: 'bottom' as Corner,
    stiff: false,
    scrolls: undefined as Record<Side, boolean> | undefined,
    loose: false,
    base: 0,
    grip: { x: 0, y: 0 },
    origin: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    point: { x: 0, y: 0 },
    shown: { x: 0, y: 0 },
    speed: 0,
    since: 0,
    travelled: 0,
    lag: 1,
    seen: 0,
    tracker: createVelocityTracker(),
    steady: createSteady(),
  };
  let stop: (() => void) | undefined;
  onDestroy(() => stop?.());

  const peek = {
    index: -1,
    side: 'right' as Side,
    corner: 'bottom' as Corner,
    start: 0,
    far: 1,
    falls: 0,
    spring: null as ReturnType<typeof solveSpring> | null,

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
      if (side === 'left' && (columns === 1 || turnBack() === 'reverse')) return undefined;
      return { side, corner: point.y > aspect / 2 ? 'bottom' : 'top' };
    },

    follow(event: PointerEvent) {
      if (event.pointerType === 'mouse') peek.raise(peek.zone(locate(event)));
    },

    raise(zone: { side: Side; corner: Corner } | undefined, far = 1) {
      const { turns } = scene;
      if (!turns) return;
      if (zone && peek.index >= 0 && zone.side === peek.side && zone.corner === peek.corner) {
        peek.falls = 0;
        return;
      }
      peek.drop();
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

    lift(time: number) {
      const { turns, aspect } = scene;
      if (peek.index >= 0 && peek.falls > 0 && time >= peek.falls) {
        peek.drop();
        return true;
      }
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

    take() {
      const index = peek.index;
      peek.index = -1;
      peek.falls = 0;
      peek.spring = null;
      if (index >= 0) say('peeking', false);
      return index;
    },
  };

  const cornerAt = (point: Point): Point => {
    if (!drag.loose) return point;
    const x = (point.x + drag.base) * 2 - 1;
    const free = cornerPath(progressOf({ x, y: 0 }), drag.corner, scene.aspect);
    return { x, y: free.y + (point.y - drag.grip.y) * 2 };
  };

  const pullsAtPage = (dx: number, dy: number) => {
    if (Math.abs(dx) > Math.abs(dy)) return true;
    const cornerLifted = peek.index >= 0 && peek.side === (dx < 0 ? 'right' : 'left');
    return cornerLifted && Math.abs(dy) <= Math.abs(dx) * LIFTED_CORNER_SLANT;
  };

  const begin = (event: PointerEvent, from: { x: number; y: number; point: Point }) => {
    const { turns, aspect } = scene;
    if (!turns) return false;
    const dx = event.clientX - from.x;
    const dy = event.clientY - from.y;
    const mouse = event.pointerType === 'mouse';
    const across = Math.abs(dx) > Math.abs(dy);
    if (!mouse && !pullsAtPage(dx, dy)) return false;

    const { columns } = state();
    const placed: Side = from.point.x >= (columns === 2 ? 0 : 0.5) ? 'right' : 'left';
    const pulled: Side = dx < 0 ? 'right' : 'left';
    if (drag.scrolls?.[pulled]) return false;
    const side = (columns === 1 || drag.scrolls) && across ? pulled : placed;
    if (!mouse && side !== pulled) return false;

    drag.loose = columns === 1 || scroller.active;
    drag.base = columns === 2 && side === 'left' ? 1 : 0;

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

  const wanted = (): Point => ({
    x: drag.point.x + drag.offset.x * drag.lag,
    y: drag.point.y + drag.offset.y * drag.lag,
  });

  const put = () => {
    const { turns, aspect } = scene;
    if (drag.held < 0 || !turns) return;
    const corner = drag.shown;
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

  const pace = (time: number) => PACE * Math.min(1, Math.max(0, time - drag.since) / PACE_TIME);

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
      if (event.pointerType === 'mouse') peek.follow(event);
      else peek.fall();
      return;
    }
    const index = drag.held;
    drag.held = -1;
    say('dragging', false);
    if (canceled) {
      turns.release(index, performance.now());
      wake();
      restore();
      return;
    }
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

  const reach = (): Record<Side, boolean> | undefined =>
    scroller.active
      ? { left: scroller.reaches('left'), right: scroller.reaches('right') }
      : undefined;

  const finger = {
    id: undefined as number | undefined,
    x: 0,
    y: 0,
    scrolls: undefined as Record<Side, boolean> | undefined,
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
          drag.pressed = false;
          if (move.pointerType !== 'mouse') peek.fall();
          return false;
        },
        onMove: ({ event: move }) => track(move),
        onEnd: end,
      });
      if (event.pointerType !== 'mouse') peek.raise(peek.zone(point), PEEK.finger);
    },

    hover(event: PointerEvent) {
      if (!drag.pressed) peek.follow(event);
    },

    leave(event: PointerEvent) {
      if (!drag.pressed && event.pointerType === 'mouse') peek.drop();
    },

    touch(event: TouchEvent) {
      const [first] = event.touches;
      finger.id = undefined;
      if (event.touches.length !== 1 || !first || !state().drag) return;
      finger.id = first.identifier;
      finger.x = first.clientX;
      finger.y = first.clientY;
      finger.scrolls = reach();
      finger.kept = undefined;
    },

    swipe(event: TouchEvent) {
      const moved = Array.from(event.touches).find((touch) => touch.identifier === finger.id);
      if (!moved || event.touches.length !== 1) return;
      if (finger.kept === undefined) {
        const dx = moved.clientX - finger.x;
        const dy = moved.clientY - finger.y;
        if (Math.hypot(dx, dy) < HEADING) return;
        const scrollsThere = finger.scrolls?.[dx < 0 ? 'right' : 'left'] === true;
        finger.kept = pullsAtPage(dx, dy) && !scrollsThere;
      }
      if ((finger.kept || drag.held >= 0) && event.cancelable) event.preventDefault();
    },

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
