import type { SnapshotRenderer, SnapshotRendererOptions } from './render';

/**
 * Whether leaves can curl here from pictures of the pages. The only part of the snapshot renderer the rest of the
 * book knows: the renderer and snapdom are fetched the first time a book asks for them, and until they arrive, or
 * if they never do, the pages fold. A book whose pictures can't be taken or drawn goes back to folding by itself.
 * To take the renderer out: delete this folder, its entry in `package.json` and `tsdown.config.ts`, and the rules
 * in `styles.css` that speak of a canvas lying over the pages.
 */

type Make = (options: Omit<SnapshotRendererOptions, 'snap'>) => SnapshotRenderer | undefined;

let state: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
let make: Make | undefined;
const listeners = new Set<() => void>();

const tell = () => {
  for (const listener of listeners) listener();
};

/** Whether pictures of pages could be drawn here: there is WebGL, and the renderer could be fetched. */
function canSnapshot(): boolean {
  return (
    state !== 'failed' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof WebGL2RenderingContext !== 'undefined'
  );
}

/** Whether the renderer is here to use. False on a server, and until `loadSnapshots` has fetched it. */
function snapshotsReady(): boolean {
  return state === 'ready';
}

/** Fetches the renderer and snapdom, once. `watchSnapshots` says when they are here. */
function loadSnapshots() {
  if (state !== 'idle' || !canSnapshot()) return;
  state = 'loading';
  Promise.all([import('./render'), import('@zumer/snapdom')]).then(
    ([renderer, { snapdom }]) => {
      make = (options) => renderer.createSnapshotRenderer({ ...options, snap: snapdom.toCanvas });
      state = 'ready';
      tell();
    },
    // It couldn't be fetched, which is so for every book: they all go on folding.
    () => {
      state = 'failed';
      tell();
    },
  );
}

/** Calls `listener` when the answer `snapshotsReady` gives changes. */
function watchSnapshots(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Makes a renderer, if it has been fetched and the canvas can be drawn to. */
function createSnapshotRenderer(options: Omit<SnapshotRendererOptions, 'snap'>) {
  return make?.(options);
}

export { canSnapshot, createSnapshotRenderer, loadSnapshots, snapshotsReady, watchSnapshots };
