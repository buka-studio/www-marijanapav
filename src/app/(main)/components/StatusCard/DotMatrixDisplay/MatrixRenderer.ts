export type MatrixFrameContext = {
  ctx: CanvasRenderingContext2D;
  cols: number;
  rows: number;
  cellSize: number;
  timeSec: number;
  dtSec: number;
  frame: number;
  dpr: number;
  width: number;
  height: number;
};

export type Palette = {
  active: string;
  inactive: string;
  background?: string;
};

export interface MatrixRenderer {
  render(ctx: MatrixFrameContext): void;
  pause(): void;
  resume(): void;
  restart?(): void;
  setPalette(palette: Palette): void;
}
