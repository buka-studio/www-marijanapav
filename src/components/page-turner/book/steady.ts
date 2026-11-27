import type { Point } from '../core';

/**
 * Steadies a point that follows a pointer. A slow pointer reports whole pixels only a few times a second, so
 * a leaf snapped to it would jump and then stand still. The point eases to it instead, faster the faster the
 * pointer moves, so it is never more than a few pixels behind.
 */

/**
 * `slow`: low-pass cutoff in Hz for a pointer that is all but still. `gain`: Hz added per page width a second
 * of pointer speed. `rate`: cutoff in Hz of the filter measuring that speed, which a stepping pointer gives
 * very unevenly.
 */
const STEADY = { slow: 3, gain: 40, rate: 4 };

/** How much of the way a low-pass filter with this cutoff, in Hz, goes in `seconds`. */
const blend = (cutoff: number, seconds: number) => 1 - Math.exp(-2 * Math.PI * cutoff * seconds);

function createSteady() {
  let last: Point | undefined;
  /** The pointer's smoothed speed, in page widths a second. */
  let rate = 0;
  /**
   * A point between the two: it follows the pointer, and the point follows it. Filtered once, the point
   * would start at full speed on every pointer step; twice, it gathers speed.
   */
  let between: Point | undefined;

  return {
    /** Forgets what it followed, for a newly grabbed point. */
    reset() {
      last = between = undefined;
      rate = 0;
    },

    /** Where a point at `from` gets to in `passed` ms on its way to `to`, where the pointer has it now. */
    toward(from: Point, to: Point, passed: number): Point {
      if (!(passed > 0)) return from;
      const seconds = passed / 1000;
      const moved = last ? Math.hypot(to.x - last.x, to.y - last.y) / seconds : 0;
      last = { x: to.x, y: to.y };
      rate += (moved - rate) * blend(STEADY.rate, seconds);
      const share = blend(STEADY.slow + STEADY.gain * rate, seconds);
      between ??= { x: from.x, y: from.y };
      between.x += (to.x - between.x) * share;
      between.y += (to.y - between.y) * share;
      return { x: from.x + (between.x - from.x) * share, y: from.y + (between.y - from.y) * share };
    },
  };
}

export { createSteady };
