import { oklabToHex } from '~/src/util';

export function getSketchStrokeColor() {
  const color = getComputedStyle(document.querySelector(':root')!).getPropertyValue('--theme-1');

  return oklabToHex(color);
}
