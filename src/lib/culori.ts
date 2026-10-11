import {
  converter,
  formatHex,
  modeLab,
  modeOklab,
  modeOklch,
  modeRgb,
  parse,
  parseHex,
  useMode as registerMode,
} from 'culori/fn';

registerMode(modeRgb);
registerMode(modeLab);
registerMode(modeOklab);
registerMode(modeOklch);

export type { Rgb } from 'culori/fn';
export { converter, formatHex, parse, parseHex };
