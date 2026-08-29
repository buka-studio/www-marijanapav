export const MOTION_STOP_PX_PER_S = 10;
export const MOTION_SETTLE_INDEX = 0.02;

export function isMotionSettled(currentIndex: number, targetIndex: number) {
  return Math.abs(currentIndex - targetIndex) < MOTION_SETTLE_INDEX;
}

export type MotionBlurParams = {
  maxBlur: number;
  blurThreshold: number;
  speedRef: number;
  attack: number;
  release: number;
};

export const defaultMotionBlurParams: MotionBlurParams = {
  maxBlur: 0.12,
  blurThreshold: 0.3,
  speedRef: 2200,
  attack: 24,
  release: 20,
};

export function stepSmoothedSpeed(
  current: number,
  velocity: number,
  dt: number,
  params: Pick<MotionBlurParams, 'attack' | 'release'>,
  reduceMotion: boolean,
) {
  if (reduceMotion || velocity <= MOTION_STOP_PX_PER_S) {
    return 0;
  }

  const easing = velocity > current ? params.attack : params.release;
  return current + (velocity - current) * (1 - Math.exp(-dt * easing));
}

export function motionBlurT(
  speed: number,
  params: Pick<MotionBlurParams, 'blurThreshold' | 'speedRef'>,
  reduceMotion: boolean,
) {
  if (reduceMotion) {
    return 0;
  }

  const amount = 1 - Math.exp(-speed / Math.max(params.speedRef, 1));
  const blurSpan = Math.max(1 - params.blurThreshold, 1e-5);
  return Math.max(0, (amount - params.blurThreshold) / blurSpan);
}
