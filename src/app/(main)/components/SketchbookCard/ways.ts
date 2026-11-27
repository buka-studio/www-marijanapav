export const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const outCubic = (t: number) => 1 - (1 - t) ** 3;
export const outQuart = (t: number) => 1 - (1 - t) ** 4;
export const inOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export const inOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

export interface Way {
  flight: number;
  opens: number;
  shows: number;
  waits: number;
  dims: { after: number; over: number };
  ease: (t: number) => number;
  round: (t: number) => number;
  turns: number;
  lean: number;
  bank: number;
  rise: number;
  small: { tall: number; most: number };
}

export const WAYS = {
  thrown: {
    flight: 900,
    opens: 400,
    shows: 60,
    waits: 0,
    dims: { after: 60, over: 300 },
    ease: outCubic,
    round: outQuart,
    turns: 1,
    lean: 14,
    bank: 0,
    rise: 0.07,
    small: { tall: 1.5, most: 0.5 },
  },
  lifted: {
    flight: 950,
    opens: 470,
    shows: 0,
    waits: 5,
    dims: { after: 180, over: 340 },
    ease: inOutCubic,
    round: (t) => inOutCubic(clamp(t / 0.68)),
    turns: 1,
    lean: 8,
    bank: 0,
    rise: 0.05,
    small: { tall: 1, most: 1 },
  },
} satisfies Record<string, Way>;

export type WayName = keyof typeof WAYS;
