import LoupeSourceCanvas from './LoupeSourceCanvas';

export type WorkerRequest = {
  id: number;
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  stampWidth: number;
  stampHeight: number;
  gridCellSize: number;
  background: string;
  foreground: string;
  bitmap: ImageBitmap;
};

export type WorkerResponse =
  | { type: 'result'; id: number; bitmap: ImageBitmap; cssWidth: number; cssHeight: number }
  | { type: 'error'; id: number; error: string };

function postResult(message: WorkerResponse, transfer?: Transferable[]) {
  (self as unknown as { postMessage: (msg: WorkerResponse, transfer?: Transferable[]) => void }).postMessage(
    message,
    transfer,
  );
}

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { id, bitmap, ...layout } = event.data;

  try {
    if (!bitmap || bitmap.width < 1 || bitmap.height < 1) {
      throw new Error('Empty stamp bitmap');
    }

    const source = new LoupeSourceCanvas();
    source.paint({ ...layout, image: bitmap });
    bitmap.close();

    const out = await source.toFlippedBitmap();
    if (out.width < 1 || out.height < 1) {
      out.close();
      throw new Error('Empty loupe bitmap');
    }

    postResult(
      { type: 'result', id, bitmap: out, cssWidth: layout.cssWidth, cssHeight: layout.cssHeight },
      [out],
    );
  } catch (error) {
    try {
      bitmap.close();
    } catch {}
    postResult({
      type: 'error',
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
