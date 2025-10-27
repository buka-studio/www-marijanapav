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
