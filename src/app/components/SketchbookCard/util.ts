export function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

export function getSketchStrokeColor() {
  const color = getComputedStyle(document.querySelector('.main')!).getPropertyValue(
    '--main-theme-1',
  );

  return color;
}
