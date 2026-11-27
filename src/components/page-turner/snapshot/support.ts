import type { SnapshotRenderer, SnapshotRendererOptions } from './render';

type Make = (options: Omit<SnapshotRendererOptions, 'snap'>) => SnapshotRenderer | undefined;

let state: 'idle' | 'loading' | 'ready' | 'failed' = 'idle';
let make: Make | undefined;
const listeners = new Set<() => void>();

const tell = () => {
  for (const listener of listeners) listener();
};

function canSnapshot(): boolean {
  return (
    state !== 'failed' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof WebGL2RenderingContext !== 'undefined'
  );
}

function snapshotsReady(): boolean {
  return state === 'ready';
}

function loadSnapshots() {
  if (state !== 'idle' || !canSnapshot()) return;
  state = 'loading';
  Promise.all([import('./render'), import('@zumer/snapdom')]).then(
    ([renderer, { snapdom }]) => {
      make = (options) => renderer.createSnapshotRenderer({ ...options, snap: snapdom.toCanvas });
      state = 'ready';
      tell();
    },
    () => {
      state = 'failed';
      tell();
    },
  );
}

function watchSnapshots(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function createSnapshotRenderer(options: Omit<SnapshotRendererOptions, 'snap'>) {
  return make?.(options);
}

export { canSnapshot, createSnapshotRenderer, loadSnapshots, snapshotsReady, watchSnapshots };
