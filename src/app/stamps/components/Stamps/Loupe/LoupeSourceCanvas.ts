import { createCanvas, drawGrid } from '../../CanvasGrid/util';

type PaintInput = {
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  stampWidth: number;
  stampHeight: number;
  gridCellSize: number;
  background: string;
  foreground: string;
  image: ImageBitmap;
};

const SHADOW_BLUR = 20;

export default class LoupeSourceCanvas {
  readonly #board = createCanvas();

  #context2d(canvas: OffscreenCanvas | HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx || !('setTransform' in ctx)) {
      throw new Error('No 2d context');
    }
    return ctx;
  }

  paint({
    cssWidth,
    cssHeight,
    dpr,
    stampWidth,
    stampHeight,
    gridCellSize,
    background,
    foreground,
    image,
  }: PaintInput) {
    const board = this.#board;
    board.width = Math.max(1, Math.round(cssWidth * dpr));
    board.height = Math.max(1, Math.round(cssHeight * dpr));

    const ctx = this.#context2d(board);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid(ctx, {
      width: cssWidth,
      height: cssHeight,
      cellWidth: gridCellSize,
      cellHeight: gridCellSize,
      lineWidth: 1,
      background,
      foreground,
      align: 'top',
    });

    const pad = Math.ceil(SHADOW_BLUR * 2);
    const stampCanvas = createCanvas(
      Math.max(1, Math.ceil((stampWidth + pad * 2) * dpr)),
      Math.max(1, Math.ceil((stampHeight + pad * 2) * dpr)),
    );
    const stampCtx = this.#context2d(stampCanvas);
    stampCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stampCtx.shadowOffsetX = 0;
    stampCtx.shadowOffsetY = 0;
    stampCtx.shadowColor = 'rgba(0,0,0,0.25)';
    stampCtx.shadowBlur = SHADOW_BLUR;
    stampCtx.drawImage(image, pad, pad, stampWidth, stampHeight);

    ctx.drawImage(
      stampCanvas,
      cssWidth / 2 - stampWidth / 2 - pad,
      cssHeight / 2 - stampHeight / 2 - pad,
      stampWidth + pad * 2,
      stampHeight + pad * 2,
    );
  }

  async toFlippedBitmap() {
    const board = this.#board;
    const width = board.width;
    const height = board.height;
    const flipped = createCanvas(width, height);
    const ctx = this.#context2d(flipped);

    ctx.scale(1, -1);
    ctx.drawImage(board, 0, -height);

    if ('transferToImageBitmap' in flipped) {
      return (flipped as OffscreenCanvas).transferToImageBitmap();
    }

    return createImageBitmap(flipped as HTMLCanvasElement);
  }
}
