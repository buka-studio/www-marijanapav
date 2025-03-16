import { oklchToHex } from '~/src/util';

export function getSketchStrokeColor() {
  const color = getComputedStyle(document.querySelector('.main')!).getPropertyValue('--theme-1');

  return oklchToHex(color);
}
