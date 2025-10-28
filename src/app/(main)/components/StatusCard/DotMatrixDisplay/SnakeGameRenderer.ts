import { BaseRenderer } from './BaseRenderer';
import type { MatrixFrameContext, Palette } from './MatrixRenderer';

type CellShape = 'circle' | 'square';

export enum Direction {
  Left = 'Left',
  Up = 'Up',
  Right = 'Right',
  Down = 'Down',
}

// todo(rpavlini): ported from rust, refactor
class SnakeGame {
  private width: number;
  private height: number;
  private moves: Direction[] = [];
  private body: number[] = [];
  private food: number = 0;
  private currDir: Direction = Direction.Left;
  private ended = false;
  private onGameOver?: (score: number) => void;
  private onScoreChange?: (score: number) => void;

  constructor({
    width,
    height,
    onGameOver,
    onScoreChange,
  }: {
    width: number;
    height: number;
    onGameOver?: (score: number) => void;
    onScoreChange?: (score: number) => void;
  }) {
    this.width = width;
    this.height = height;
    this.reset(width, height);
    this.onGameOver = onGameOver;
    this.onScoreChange = onScoreChange;
  }

  private getIndex(row: number, col: number): number {
    return row * this.width + col;
  }

  private getCoords(index: number): [number, number] {
    const row = Math.floor(index / this.width);
    const col = index - row * this.width;
    return [row, col];
  }

  private randInt(maxExclusive: number): number {
    return Math.floor(Math.random() * maxExclusive);
  }

  private reset(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.moves = [];
    this.currDir = Direction.Left;
    this.body = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    this.food = this.randInt(width * height);
    this.ended = false;
  }

  public restart(width?: number, height?: number) {
    this.reset(width ?? this.width, height ?? this.height);
  }

  public addMove(direction: Direction) {
    this.moves.push(direction);
  }

  public tick() {
    if (this.ended) {
      return;
    }

    let ateFood = false;

    // Detect overlap between body and food (or self) before moving
    const allCells = [...this.body, this.food];
    const cellOverlaps = new Map<number, number>();
    for (const id of allCells) {
      cellOverlaps.set(id, (cellOverlaps.get(id) ?? 0) + 1);
    }

    if ([...cellOverlaps.values()].some((v) => v > 1)) {
      ateFood = (cellOverlaps.get(this.food) ?? 0) > 1;
      if (!ateFood) {
        this.ended = true;
        this.onGameOver?.(this.getScore());
        return;
      } else {
        this.food = this.randInt(this.width * this.height);
      }
    }

    const prevDir = this.currDir;
    const nextDir = this.moves.length > 0 ? this.moves.shift()! : undefined;
    if (nextDir) {
      // prevent immediate 180-degree reversal
      const isInvalidMove =
        (prevDir === Direction.Left && nextDir === Direction.Right) ||
        (prevDir === Direction.Right && nextDir === Direction.Left) ||
        (prevDir === Direction.Up && nextDir === Direction.Down) ||
        (prevDir === Direction.Down && nextDir === Direction.Up);
      this.currDir = isInvalidMove ? prevDir : nextDir;
    }

    const [hr, hc] = this.getCoords(this.body[0]);
    let nr = hr;
    let nc = hc;
    switch (this.currDir) {
      case Direction.Left:
        nc = (this.width + hc - 1) % this.width;
        break;
      case Direction.Right:
        nc = (hc + 1) % this.width;
        break;
      case Direction.Up:
        nr = (this.height + hr - 1) % this.height;
        break;
      case Direction.Down:
        nr = (hr + 1) % this.height;
        break;
    }
    const newHead = this.getIndex(nr, nc);

    const newBody: number[] = [newHead];
    if (!ateFood) {
      this.body.pop();
    }
    newBody.push(...this.body);
    this.body = newBody;

    if (ateFood) {
      this.onScoreChange?.(this.getScore());
    }
  }

  public getWidth(): number {
    return this.width;
  }

  public getHeight(): number {
    return this.height;
  }

  public getBody(): number[] {
    return this.body.slice();
  }

  public getFood(): number {
    return this.food;
  }

  public getEnded(): boolean {
    return this.ended;
  }

  public getLength(): number {
    return this.body.length;
  }

  public getScore(): number {
    return Math.max(0, this.body.length - 12);
  }
}

interface Options {
  palette: Palette;
  cellShape?: CellShape;
  glow?: boolean;
  cellPadding?: number;
  foodColor?: string;
  onGameOver?: (score: number) => void;
  onScoreChange?: (score: number) => void;
  fps?: number;
}

export default class SnakeGameRenderer extends BaseRenderer {
  private accMs: number = 0;
  private targetIntervalMs: number = 0;

  private options: Options;

  private game: SnakeGame | null = null;
  private accumulatorSec = 0;

  constructor(options: Options) {
    super();
    this.options = {
      cellShape: 'circle',
      glow: false,
      cellPadding: 0.25,
      fps: 10,
      ...options,
    };

    this.targetIntervalMs = 1000 / (this.options.fps ?? 30);
  }

  public enqueueDirection(dir: Direction) {
    this.game?.addMove(dir);
  }

  public restart() {
    if (this.game) {
      this.game.restart();
    }
  }

  public setPalette(palette: Palette) {
    this.options.palette = {
      ...this.options.palette,
      ...palette,
    };
  }

  private ensureGame(cols: number, rows: number) {
    if (!this.game) {
      this.game = new SnakeGame({
        width: cols,
        height: rows,
        onGameOver: this.options.onGameOver,
        onScoreChange: this.options.onScoreChange,
      });
      this.accumulatorSec = 0;
    } else if (this.game.getWidth() !== cols || this.game.getHeight() !== rows) {
      this.game = new SnakeGame({
        width: cols,
        height: rows,
        onGameOver: this.options.onGameOver,
        onScoreChange: this.options.onScoreChange,
      });
      this.accumulatorSec = 0;
    }
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string,
  ) {
    const { cellShape, cellPadding } = this.options;
    const radius = size / 2 - (cellPadding ?? 0);
    ctx.fillStyle = color;
    ctx.beginPath();
    if (cellShape === 'circle') {
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    } else {
      ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
    ctx.fill();
  }

  // todo(rpavlini): draw to offscreen canvas
  private renderBackground({ ctx, cols, rows, cellSize }: MatrixFrameContext) {
    const { palette } = this.options;
    if (palette.background) {
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const centerX = c * cellSize + cellSize / 2;
        const centerY = r * cellSize + cellSize / 2;
        this.drawCell(ctx, centerX, centerY, cellSize, this.options.palette.inactive);
      }
    }
  }

  private renderActiveCell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellSize: number,
    color: string,
  ) {
    const { glow } = this.options;
    if (glow) {
      ctx.save();
      ctx.shadowBlur = cellSize * 1.5;
      ctx.shadowColor = color;
      this.drawCell(ctx, x, y, cellSize, color);
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      const r = cellSize * 0.25;
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      this.drawCell(ctx, x, y, cellSize, color);
    }
  }

  protected renderFrame(context: MatrixFrameContext): void {
    const { ctx, cols, rows, cellSize, dtSec } = context;

    this.accMs += dtSec * 1000;

    if (this.accMs < this.targetIntervalMs) {
      return;
    }
    this.accMs -= this.targetIntervalMs;

    this.ensureGame(cols, rows);
    if (!this.game) {
      return;
    }

    this.renderBackground(context);

    this.game.tick();

    const foodIdx = this.game.getFood();
    const fr = Math.floor(foodIdx / cols);
    const fc = foodIdx - fr * cols;
    const fx = fc * cellSize + cellSize / 2;
    const fy = fr * cellSize + cellSize / 2;
    this.renderActiveCell(
      ctx,
      fx,
      fy,
      cellSize,
      this.options.foodColor ?? this.options.palette.active,
    );

    const color = this.options.palette.active;
    const body = this.game.getBody();

    for (let i = 0; i < body.length; i++) {
      const id = body[i];
      const r = Math.floor(id / cols);
      const c = id - r * cols;
      const x = c * cellSize + cellSize / 2;
      const y = r * cellSize + cellSize / 2;
      this.renderActiveCell(ctx, x, y, cellSize, color);
    }
  }
}
