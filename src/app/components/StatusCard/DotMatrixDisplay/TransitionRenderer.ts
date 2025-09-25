import { parseHex, Rgb } from 'culori';

import { BaseRenderer } from './BaseRenderer';
import { MatrixFrameContext, Palette } from './MatrixRenderer';

interface Options {
  lightUpDurationMs?: number;
  fadeDurationMs?: number;
  maxRandomDelayMs?: number;
  cellRadius?: number;
  cellPadding?: number;
  cellShape?: CellShape;
  palette?: Palette;
}

type TransitionCell = {
  row: number;
  col: number;
  startTime: number;
  lightUpCompleteTime: number;
  fadeCompleteTime: number;
};

type CellShape = 'circle' | 'square';

export type TransitionDirection = 'up' | 'down' | 'left' | 'right';

export default class TransitionRenderer extends BaseRenderer {
  private options: Required<Options>;
  private activeRgb?: Rgb;
  private inactiveRgb?: Rgb;

  constructor(options: Options) {
    super();

    this.options = {
      lightUpDurationMs: 100,
      fadeDurationMs: 300,
      maxRandomDelayMs: 200,
      cellRadius: 4,
      cellPadding: 3,
      cellShape: 'circle',
      palette: { active: '#FFFFFF', inactive: 'rgba(20, 20, 20, 1)' },
      ...options,
    };

    this.activeRgb = parseHex(this.options.palette.active);
    this.inactiveRgb = parseHex(this.options.palette.inactive);
  }

  public setPalette(palette: Palette): void {
    this.options.palette = palette;
    this.activeRgb = parseHex(palette.active);
    this.inactiveRgb = parseHex(palette.inactive);
  }

  protected renderFrame(ctx: MatrixFrameContext): void {
    return;
  }

  public renderTransition(
    context: MatrixFrameContext,
    params: { durationSeconds?: number; direction?: TransitionDirection } = {},
  ): Promise<void> {
    return new Promise((resolve) => {
      const { cols, rows } = context;
      const durationMs = (params.durationSeconds ?? 2) * 1000;
      const direction = params.direction ?? 'up';

      const cells = this.initTransitionCells(rows, cols, durationMs, direction);
      const totalDuration = durationMs + this.options.fadeDurationMs;

      let animationFrameId: number;
      let startTime: number | null = null;

      const animationLoop = (nowMs: number) => {
        if (startTime === null) {
          startTime = nowMs;
        }
        const elapsedTime = nowMs - startTime;

        this.renderTransitionFrame(context, cells, elapsedTime);

        if (elapsedTime > totalDuration) {
          cancelAnimationFrame(animationFrameId);
          resolve();
        } else {
          animationFrameId = requestAnimationFrame(animationLoop);
        }
      };

      animationFrameId = requestAnimationFrame(animationLoop);
    });
  }

  private initTransitionCells(
    numRows: number,
    numCols: number,
    totalAnimationDuration: number,
    direction: TransitionDirection,
  ): TransitionCell[] {
    const cellsArray: TransitionCell[] = [];
    const { fadeDurationMs, lightUpDurationMs, maxRandomDelayMs } = this.options;

    const maxStaggerDelay = totalAnimationDuration - fadeDurationMs;
    const totalStaggerSteps =
      direction === 'up' || direction === 'down' ? numRows - 1 : numCols - 1;
    const baseStaggerPerCell = totalStaggerSteps > 0 ? maxStaggerDelay / totalStaggerSteps : 0;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        let step;
        switch (direction) {
          case 'up':
            step = numRows - 1 - r;
            break;
          case 'down':
            step = r;
            break;
          case 'left':
            step = numCols - 1 - c;
            break;
          case 'right':
          default:
            step = c;
            break;
        }

        const baseDelay = step * baseStaggerPerCell;
        const randomDelay = Math.random() * maxRandomDelayMs;
        const startTime = baseDelay + randomDelay;

        cellsArray.push({
          row: r,
          col: c,
          startTime: startTime,
          lightUpCompleteTime: startTime + lightUpDurationMs,
          fadeCompleteTime: startTime + lightUpDurationMs + fadeDurationMs,
        });
      }
    }
    return cellsArray;
  }

  private renderTransitionFrame(
    context: MatrixFrameContext,
    cells: TransitionCell[],
    elapsedTime: number,
  ): void {
    const { width, height, cellSize, ctx } = context;
    const { palette } = this.options;

    ctx.clearRect(0, 0, width, height);
    if (palette?.background) {
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, width, height);
    }

    for (const cell of cells) {
      let currentOpacity = 0;
      const { fadeDurationMs } = this.options;

      if (elapsedTime >= cell.startTime && elapsedTime < cell.fadeCompleteTime) {
        if (elapsedTime < cell.lightUpCompleteTime) {
          currentOpacity = 1;
        } else {
          const fadeProgress = (elapsedTime - cell.lightUpCompleteTime) / fadeDurationMs;
          currentOpacity = 1 - fadeProgress;
        }
      }

      this.drawCell(ctx, cell.row, cell.col, cellSize, currentOpacity);
    }
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    row: number,
    col: number,
    cellSize: number,
    opacity: number,
  ): void {
    const { cellPadding, cellShape, palette } = this.options;

    const centerX = col * cellSize + cellSize / 2;
    const centerY = row * cellSize + cellSize / 2;
    const radius = cellSize / 2 - (cellPadding ?? 0);

    let finalFillColor = palette.inactive;
    if (this.activeRgb && opacity > 0) {
      finalFillColor = `rgba(${this.activeRgb.r * 255},${this.activeRgb.g * 255},${
        this.activeRgb.b * 255
      },${opacity})`;
    }

    ctx.fillStyle = finalFillColor;
    ctx.beginPath();

    if (cellShape === 'circle') {
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    } else {
      ctx.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    }

    ctx.fill();
  }
}
