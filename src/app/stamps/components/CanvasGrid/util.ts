export type GridAlign = 'top' | 'center';

export type GridOptions = {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  lineWidth: number;
  background: string;
  foreground: string;
  align: GridAlign;
};

export type NoiseOpts = {
  size: number;
  density: number;
  opacity: number;
  seed: number;
  composite: GlobalCompositeOperation;
};

export function setupHiDPICtx(canvas: HTMLCanvasElement, width: number, height: number, dpr = 1) {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, dpr };
}

export function drawGrid(ctx: CanvasRenderingContext2D, opts: GridOptions) {
  const { width, height, cellWidth, cellHeight, lineWidth, background, foreground, align } = opts;

  const offsetX = (width % cellWidth) / 2;
  const offsetY = align === 'center' ? (height % cellHeight) / 2 : 0;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  ctx.beginPath();
  const half = lineWidth % 2 ? 0.5 : 0;

  for (let x = offsetX + cellWidth; x < width - offsetX; x += cellWidth) {
    const ax = x + half;
    ctx.moveTo(ax, half);
    ctx.lineTo(ax, height - half);
  }

  for (let y = offsetY + cellHeight; y < height - offsetY; y += cellHeight) {
    const ay = y + half;
    ctx.moveTo(half, ay);
    ctx.lineTo(width - half, ay);
  }

  ctx.strokeStyle = foreground;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  return ctx;
}

export function createLCGRandom(seed: number) {
  let s = seed >>> 0;
  return () => (s = (1664525 * s + 1013904223) >>> 0) / 0xffffffff;
}

export function createGaussianBoxMuller(rand: () => number) {
  return () => {
    let u = 0,
      v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
}

export type Canvas = HTMLCanvasElement | OffscreenCanvas;

export function createNoiseTileCanvas(size: number, density: number, seed: number): Canvas {
  const canvas: Canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(size, size)
      : document.createElement('canvas');

  canvas.width = size;
  canvas.height = size;

  const ctx = (canvas as any).getContext('2d') as CanvasRenderingContext2D;
  const img = ctx.createImageData(size, size);

  const rand = createLCGRandom(seed);
  const gaussian = createGaussianBoxMuller(rand);
  const sigma = density * 255;

  for (let i = 0; i < img.data.length; i += 4) {
    const n = gaussian() * sigma + 127.5;
    img.data[i] = n;
    img.data[i + 1] = n;
    img.data[i + 2] = n;
    img.data[i + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  return canvas;
}

export function drawNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  opts: NoiseOpts,
) {
  const { size, density, opacity, seed, composite } = opts;

  const tile = createNoiseTileCanvas(size, density, seed);
  const pattern = ctx.createPattern(tile as CanvasImageSource, 'repeat')!;

  ctx.save();
  const prevOp = ctx.globalCompositeOperation;
  const prevAlpha = ctx.globalAlpha;

  ctx.globalCompositeOperation = composite;
  ctx.globalAlpha = opacity;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = prevAlpha;
  ctx.globalCompositeOperation = prevOp;
  ctx.restore();
}
