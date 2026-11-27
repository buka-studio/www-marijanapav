'use client';

import type { BookRenderer } from '../renderer';
import { createCanvasRenderer } from './render';
import { canCurl } from './support';

const curl: BookRenderer = {
  name: 'curl',
  canvas: 'around',
  can: canCurl,
  ready: canCurl,
  load: () => {},
  watch: () => () => {},
  create: ({ canvas, page, faces, hard, board, columns, blanks, drawn, failed }) =>
    createCanvasRenderer({ canvas, page, faces, hard, board, columns, blanks, drawn, failed }),
};

export { curl };
export type { BookRenderer };
