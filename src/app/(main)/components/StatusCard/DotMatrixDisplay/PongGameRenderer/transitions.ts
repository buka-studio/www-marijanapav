import { MatrixFrameContext } from '../MatrixRenderer';
import { Player } from './models';

export abstract class RoundTransition {
  public finished = false;

  public abstract tick(dt: number): void;
  public abstract render(context: MatrixFrameContext): void;
}

type PixelRenderCallback = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) => void;

export class GoalFlashTransition extends RoundTransition {
  private elapsed = 0;
  private togglesRemaining: number;
  private visible = true;

  constructor(
    private side: Player,
    private interval: number,
    private count: number,
    private color: string,
    private renderPixel: PixelRenderCallback,
  ) {
    super();
    this.togglesRemaining = count * 2;
    if (this.togglesRemaining <= 0) {
      this.finished = true;
    }
  }

  public tick(dt: number): void {
    if (this.finished) {
      return;
    }
    this.elapsed += dt;
    if (this.elapsed >= this.interval) {
      this.elapsed -= this.interval;
      this.visible = !this.visible;
      this.togglesRemaining -= 1;
      if (this.togglesRemaining <= 0) {
        this.visible = false;
        this.finished = true;
      }
    }
  }

  public render({ ctx, rows, cols, cellSize }: MatrixFrameContext): void {
    if (!this.visible || this.finished) {
      return;
    }
    const column = this.side === Player.Left ? 0 : cols - 1;

    for (let r = 0; r < rows; r++) {
      const x = column * cellSize + cellSize / 2;
      const y = r * cellSize + cellSize / 2;
      ctx.save();
      ctx.globalAlpha = 0.4;
      this.renderPixel(ctx, x, y, cellSize, this.color);
      ctx.restore();
    }
  }
}

export class BallSpawnTransition extends RoundTransition {
  private elapsed = 0;

  constructor(
    private duration: number,
    private color: string,
    private position: { x: number; y: number },
    private renderPixel: PixelRenderCallback,
  ) {
    super();
  }

  public tick(dt: number): void {
    if (this.finished) {
      return;
    }
    this.elapsed += dt;
    if (this.elapsed >= this.duration) {
      this.finished = true;
    }
  }

  public render(context: MatrixFrameContext): void {
    if (this.finished) {
      return;
    }

    const { cols, rows, cellSize, ctx } = context;
    const { color, position } = this;
    const centerX = Number.isFinite(position.x) ? position.x : cols / 2;
    const centerY = Number.isFinite(position.y) ? position.y : rows / 2;

    const maxRadiusCells = Math.max(2.5, Math.min(cols, rows) * 0.45);
    const progress = Math.min(1, this.elapsed / this.duration);
    const radius = 0.35 + progress * maxRadiusCells;
    const ringWidth = 0.7;
    const fade = 1.2 - progress;

    const startCol = Math.max(0, Math.floor(centerX - radius - 1));
    const endCol = Math.min(cols - 1, Math.ceil(centerX + radius + 1));
    const startRow = Math.max(0, Math.floor(centerY - radius - 1));
    const endRow = Math.min(rows - 1, Math.ceil(centerY + radius + 1));

    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        const dx = col + 0.5 - centerX;
        const dy = row + 0.5 - centerY;
        const distance = Math.hypot(dx, dy);
        if (distance > radius || distance < 0.15) {
          continue;
        }

        const ringDistance = Math.abs(distance - radius);
        const ringFactor = Math.max(0, 1 - ringDistance / ringWidth);
        const coreFactor = Math.max(0, (radius - distance) / radius) * 0.3;
        const intensity = (ringFactor * 0.7 + coreFactor) * fade;

        if (intensity <= 0.02) {
          continue;
        }

        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;

        ctx.save();

        ctx.globalAlpha = Math.min(1, intensity);
        this.renderPixel(ctx, x, y, cellSize, color);

        ctx.restore();
      }
    }
  }
}
