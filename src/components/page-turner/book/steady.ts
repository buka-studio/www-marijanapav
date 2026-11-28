import type { Point } from '../core';

const STEADY = { slow: 3, gain: 40, rate: 4 };

const blend = (cutoff: number, seconds: number) => 1 - Math.exp(-2 * Math.PI * cutoff * seconds);

function createSteady() {
  let last: Point | undefined;
  let rate = 0;
  let between: Point | undefined;

  return {
    reset() {
      last = between = undefined;
      rate = 0;
    },

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
