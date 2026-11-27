'use client';

import type { BookRenderer } from '../renderer';
import {
  canSnapshot,
  createSnapshotRenderer,
  loadSnapshots,
  snapshotsReady,
  watchSnapshots,
} from './support';

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
