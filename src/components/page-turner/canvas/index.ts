'use client';

import type { BookRenderer } from '../renderer';
import { createCanvasRenderer } from './render';
import { canCurl } from './support';

/**
 * Bends the pages into a curl, in browsers that can draw elements into a canvas: the pages go inside one, still
 * elements, laid out and reachable. Elsewhere, and in the server's HTML, the pages fold. `curl.can()` says which.
 *
 * @example
 * import { curl } from "page-turner/curl"
 *
 * <Book renderer={curl}>…</Book>
 */
const curl: BookRenderer = {
  name: 'curl',
  canvas: 'around',
  can: canCurl,
  ready: canCurl,
  load: () => {},
  // What the browser can do doesn't change while the page is open.
  watch: () => () => {},
  create: ({ canvas, page, faces, hard, board, columns, blanks, drawn, failed }) =>
    createCanvasRenderer({ canvas, page, faces, hard, board, columns, blanks, drawn, failed }),
};

export { curl };
export type { BookRenderer };
