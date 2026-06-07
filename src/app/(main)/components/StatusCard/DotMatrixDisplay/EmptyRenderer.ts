import { BaseRenderer } from './BaseRenderer';
import { MatrixFrameContext, Palette } from './MatrixRenderer';

type CellShape = 'circle' | 'square';

type Options = {
  cellPadding?: number;
  cellShape?: CellShape;
  palette?: Palette;
};

export default class EmptyRenderer extends BaseRenderer {
  private options: Required<Options>;

  constructor(options: Options = {}) {
    super();

    this.options = {
      cellPadding: 0.25,
      cellShape: 'circle',
      palette: { active: '#FFFFFF', inactive: 'rgba(20, 20, 20, 1)' },
      ...options,
    };
  }

  public setPalette(palette: Palette) {
    this.options.palette = {
      ...this.options.palette,
      ...palette,
    };
  }

  protected renderFrame(context: MatrixFrameContext): void {
    const { cols, rows, cellSize, ctx, width, height } = context;
    const { palette } = this.options;

    ctx.clearRect(0, 0, width, height);
    if (palette.background) {
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, width, height);
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.drawCell(ctx, row, col, cellSize);
      }
    }
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    row: number,
    col: number,
    cellSize: number,
  ): void {
    const { cellPadding, cellShape, palette } = this.options;
    const centerX = col * cellSize + cellSize / 2;
    const centerY = row * cellSize + cellSize / 2;
    const radius = cellSize / 2 - cellPadding;

    ctx.fillStyle = palette.inactive;
    ctx.beginPath();

    if (cellShape === 'circle') {
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    } else {
      ctx.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    }

    ctx.fill();
  }
}
