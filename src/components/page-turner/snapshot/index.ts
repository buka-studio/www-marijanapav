'use client';

import type { BookRenderer } from '../renderer';
import {
  canSnapshot,
  createSnapshotRenderer,
  loadSnapshots,
  snapshotsReady,
  watchSnapshots,
} from './support';

/**
 * Curls the pages from pictures of them, taken with snapdom, in any browser with WebGL: its canvas lies over pages
 * that stay as they are. The pictures take a moment, and don't follow a hover or an animation. An experiment: it
 * and snapdom are fetched only once a book that asks for it is on the page.
 *
 * @example
 * import { curl } from "page-turner/curl"
 * import { snapshot } from "page-turner/snapshot"
 *
 * <Book renderer={curl} fallback={snapshot}>…</Book>
 */
const snapshot: BookRenderer = {
  name: 'snapshot',
  canvas: 'over',
  can: canSnapshot,
  ready: snapshotsReady,
  load: loadSnapshots,
  watch: watchSnapshots,
  create: ({ canvas, pages, page, faces, hard, board, columns, blanks, drawn, failed }) =>
    createSnapshotRenderer({
      canvas,
      stage: pages,
      page,
      faces,
      hard,
      board,
      columns,
      blanks,
      drawn,
      failed,
    }),
};

export { snapshot };
export type { BookRenderer };
