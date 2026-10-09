export function lerp(start: number, end: number, amt: number) {
  return (1 - amt) * start + amt * end;
}

export function remap(value: number, from1: number, to1: number, from2: number, to2: number) {
  return ((value - from1) / (to1 - from1)) * (to2 - from2) + from2;
}

export function positiveSin(amt: number) {
  return remap(Math.sin(amt), -1, 1, 0, 1);
}

export function positiveCos(amt: number) {
  return remap(Math.sin(amt), -1, 1, 0, 1);
}

export function clamp(min: number, max: number, value: number) {
  return Math.min(Math.max(value, min), max);
}

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function radToDeg(rad: number) {
  return rad * (180 / Math.PI);
}

export function degToRad(deg: number) {
  return deg * (Math.PI / 180);
}

export function sampleStops(stops: readonly number[], t: number) {
  if (stops.length === 0) {
    return 0;
  }
  if (t <= 0) {
    return stops[0]!;
  }
  if (t >= 1) {
    return stops[stops.length - 1]!;
  }

  const n = stops.length - 1;
  const x = t * n;
  const i = Math.min(n - 1, Math.floor(x));
  return lerp(stops[i]!, stops[i + 1]!, x - i);
}

export function rotate2d(x: number, y: number, radians: number) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

export function velocityFromSamples(
  samples: readonly { t: number; x: number; y: number }[],
  { windowMs = 80, minDt = 12 } = {},
) {
  if (samples.length < 2) {
    return { vx: 0, vy: 0 };
  }

  const newest = samples[samples.length - 1]!;
  const cutoff = newest.t - windowMs;
  let oldest = samples[0]!;
  for (const sample of samples) {
    if (sample.t >= cutoff) {
      oldest = sample;
      break;
    }
  }

  const dt = newest.t - oldest.t;
  if (dt < minDt) {
    return { vx: 0, vy: 0 };
  }

  return {
    vx: (newest.x - oldest.x) / dt,
    vy: (newest.y - oldest.y) / dt,
  };
}
