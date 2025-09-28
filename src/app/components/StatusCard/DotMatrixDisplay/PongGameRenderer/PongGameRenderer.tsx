import { BaseRenderer } from '../BaseRenderer';
import type { MatrixFrameContext, Palette } from '../MatrixRenderer';
import { Player, PongDirection } from './models';
import { BallSpawnTransition, GoalFlashTransition, RoundTransition } from './transitions';

class PongGame {
  private width: number;
  private height: number;

  public paddleLeftY: number = 0;
  public paddleRightY: number = 0;
  public ballX: number = 0;
  public ballY: number = 0;
  private ballVX: number = 0;
  private ballVY: number = 0;
  private isGameOver: boolean = false;

  public readonly paddleWidth: number;
  public readonly paddleHeight: number;
  public readonly ballRadius: number = 0.5;
  public readonly paddleOffset: number;
  public readonly maxScore: number;

  public scoreLeft: number = 0;
  public scoreRight: number = 0;

  private onGameOver?: (score: { left: number; right: number }) => void;
  private onScoreChange?: (score: { left: number; right: number }) => void;

  constructor({
    width,
    height,
    onGameOver,
    onScoreChange,
    paddleWidth,
    paddleOffset,
    maxScore,
  }: {
    width: number;
    height: number;
    onGameOver?: (score: { left: number; right: number }) => void;
    onScoreChange?: (score: { left: number; right: number }) => void;
    paddleWidth?: number;
    paddleOffset?: number;
    maxScore?: number;
  }) {
    this.width = width;
    this.height = height;
    this.paddleHeight = 3;
    this.paddleWidth = paddleWidth ?? 1;
    this.paddleOffset = paddleOffset ?? 1;
    this.maxScore = maxScore ?? 5;
    this.onGameOver = onGameOver;
    this.onScoreChange = onScoreChange;
    this.reset();
  }

  private resetBall(servingPlayer: Player = Player.Left) {
    this.ballX = this.width / 2;
    this.ballY = this.height / 2;

    const speed = this.width * 0.5;
    const angle = Math.random() * (Math.PI / 3) - Math.PI / 6;

    this.ballVX = speed * Math.cos(angle) * (servingPlayer === Player.Left ? -1 : 1);
    this.ballVY = speed * Math.sin(angle);
  }

  public reset(servingPlayer: Player = Player.Left) {
    this.paddleLeftY = this.height / 2 - this.paddleHeight / 2;
    this.paddleRightY = this.height / 2 - this.paddleHeight / 2;
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.isGameOver = false;
    this.resetBall(servingPlayer);
  }

  public movePaddle(player: Player, direction: PongDirection, dtSec: number) {
    const speed = this.height * 5;
    const moveAmount = (direction === PongDirection.Up ? -1 : 1) * speed * dtSec;

    if (player === Player.Left) {
      this.paddleLeftY = Math.max(
        0,
        Math.min(this.height - this.paddleHeight, this.paddleLeftY + moveAmount),
      );
    } else {
      this.paddleRightY = Math.max(
        0,
        Math.min(this.height - this.paddleHeight, this.paddleRightY + moveAmount),
      );
    }
  }

  public moveComputerPaddle(dtSec: number) {
    let targetY: number;
    const paddleCenter = this.paddleRightY + this.paddleHeight / 2;

    if (this.ballVX > 0) {
      const timeToImpact =
        (this.width - this.paddleWidth - this.paddleOffset - this.ballX) / this.ballVX;
      let predictedY = this.ballY + this.ballVY * timeToImpact;

      while (predictedY < 0 || predictedY > this.height) {
        if (predictedY < 0) {
          predictedY = -predictedY;
        }
        if (predictedY > this.height) {
          predictedY = this.height - (predictedY - this.height);
        }
      }
      targetY = predictedY;

      const tolerance = this.paddleHeight / 3;
      if (Math.abs(targetY - paddleCenter) < tolerance) {
        return;
      }
    } else {
      targetY = this.height / 2;
    }

    const distance = targetY - paddleCenter;
    const speed = this.ballVX > 0 ? this.height * 4 : this.height * 1.5;
    const maxMove = speed * dtSec;
    const moveAmount = Math.max(-maxMove, Math.min(maxMove, distance));
    this.paddleRightY = Math.max(
      0,
      Math.min(this.height - this.paddleHeight, this.paddleRightY + moveAmount),
    );
  }

  public tick(dtSec: number) {
    if (this.isGameOver) {
      return;
    }

    this.ballX += this.ballVX * dtSec;
    this.ballY += this.ballVY * dtSec;

    if (
      (this.ballY < this.ballRadius && this.ballVY < 0) ||
      (this.ballY > this.height - this.ballRadius && this.ballVY > 0)
    ) {
      this.ballVY *= -1;
    }

    const ballRect = {
      top: this.ballY - this.ballRadius,
      bottom: this.ballY + this.ballRadius,
      left: this.ballX - this.ballRadius,
      right: this.ballX + this.ballRadius,
    };

    const leftPaddleRect = {
      top: this.paddleLeftY,
      bottom: this.paddleLeftY + this.paddleHeight,
      left: this.paddleOffset,
      right: this.paddleOffset + this.paddleWidth,
    };
    if (
      this.ballVX < 0 &&
      ballRect.left < leftPaddleRect.right &&
      ballRect.right > leftPaddleRect.left &&
      ballRect.bottom > leftPaddleRect.top &&
      ballRect.top < leftPaddleRect.bottom
    ) {
      const relativeIntersectY = leftPaddleRect.top + this.paddleHeight / 2 - this.ballY;
      const normalizedIntersect = relativeIntersectY / (this.paddleHeight / 2);
      const clamped = Math.max(-1, Math.min(1, normalizedIntersect));
      const bounceAngle = clamped * (Math.PI / 6);
      const speed = Math.hypot(this.ballVX, this.ballVY) * 1.2;
      this.ballVX = speed * Math.cos(bounceAngle);
      this.ballVY = speed * -Math.sin(bounceAngle);
      this.ballX = this.paddleOffset + this.paddleWidth + this.ballRadius;
    }

    const rightPaddleRect = {
      top: this.paddleRightY,
      bottom: this.paddleRightY + this.paddleHeight,
      left: this.width - this.paddleWidth - this.paddleOffset,
      right: this.width - this.paddleOffset,
    };
    if (
      this.ballVX > 0 &&
      ballRect.right > rightPaddleRect.left &&
      ballRect.left < rightPaddleRect.right &&
      ballRect.bottom > rightPaddleRect.top &&
      ballRect.top < rightPaddleRect.bottom
    ) {
      const relativeIntersectY = rightPaddleRect.top + this.paddleHeight / 2 - this.ballY;
      const normalizedIntersect = relativeIntersectY / (this.paddleHeight / 2);
      const clamped = Math.max(-1, Math.min(1, normalizedIntersect));
      const bounceAngle = clamped * (Math.PI / 6);
      const speed = Math.hypot(this.ballVX, this.ballVY) * 1.2;
      this.ballVX = speed * -Math.cos(bounceAngle);
      this.ballVY = speed * -Math.sin(bounceAngle);
      this.ballX = this.width - this.paddleWidth - this.paddleOffset - this.ballRadius;
    }

    if (this.ballX < -this.ballRadius) {
      this.scoreRight++;
      this.onScoreChange?.({ left: this.scoreLeft, right: this.scoreRight });
      if (this.scoreRight >= this.maxScore) {
        this.isGameOver = true;
        this.onGameOver?.({ left: this.scoreLeft, right: this.scoreRight });
      } else {
        this.resetBall(Player.Right);
      }
    } else if (this.ballX > this.width + this.ballRadius) {
      this.scoreLeft++;
      this.onScoreChange?.({ left: this.scoreLeft, right: this.scoreRight });
      if (this.scoreLeft >= this.maxScore) {
        this.isGameOver = true;
        this.onGameOver?.({ left: this.scoreLeft, right: this.scoreRight });
      } else {
        this.resetBall(Player.Left);
      }
    }
  }

  public getWidth() {
    return this.width;
  }
  public getHeight() {
    return this.height;
  }
  public getIsGameOver() {
    return this.isGameOver;
  }
}

interface Options {
  palette: Palette;
  glow?: boolean;
  onScoreChange?: (score: { left: number; right: number }) => void;
  onGameOver?: (score: { left: number; right: number }) => void;
  computerOpponent?: boolean;
  cellShape?: 'circle' | 'square';
  cellPadding?: number;
  snapBallToGrid?: boolean;
  paddleWidth?: number;
  paddleOffset?: number;
  maxScore?: number;
}

export default class PongGameRenderer extends BaseRenderer {
  private options: Options;
  private game: PongGame | null = null;
  private keyPresses: { [key in Player]: PongDirection | null } = {
    [Player.Left]: null,
    [Player.Right]: null,
  };

  private roundTransitions: RoundTransition[] = [];

  private lastScore: { left: number; right: number } = { left: 0, right: 0 };
  private boardSize = { cols: 0, rows: 0 };

  constructor(options: Options) {
    super();
    this.options = {
      glow: true,
      computerOpponent: true,
      cellShape: 'circle',
      cellPadding: 0.2,
      snapBallToGrid: false,
      paddleWidth: 1,
      paddleOffset: 2,
      maxScore: 5,
      ...options,
    };
  }

  public restart() {
    this.game?.reset();
    this.lastScore = { left: 0, right: 0 };
    this.roundTransitions = [this.makeBallSpawnTransition()];
  }

  public setKeyPress(player: Player, direction: PongDirection | null) {
    this.keyPresses[player] = direction;
  }
  public setPalette(palette: { active: string; inactive: string }) {
    this.options.palette = { ...this.options.palette, ...palette };
  }

  private ensureGame(cols: number, rows: number) {
    if (!this.game || this.game.getWidth() !== cols || this.game.getHeight() !== rows) {
      this.game = new PongGame({
        width: cols,
        height: rows,
        onScoreChange: (score) => this.handleScoreChange(score),
        onGameOver: this.options.onGameOver,
        paddleWidth: this.options.paddleWidth,
        paddleOffset: this.options.paddleOffset,
        maxScore: this.options.maxScore,
      });
      this.lastScore = { left: 0, right: 0 };
      this.boardSize = { cols, rows };
      this.roundTransitions = [this.makeBallSpawnTransition()];
    }
  }

  private getScorer(score: { left: number; right: number }): Player | null {
    if (score.left > this.lastScore.left) {
      return Player.Left;
    } else if (score.right > this.lastScore.right) {
      return Player.Right;
    }
    return null;
  }

  private handleScoreChange(score: { left: number; right: number }) {
    this.options.onScoreChange?.(score);

    const scorer = this.getScorer(score);
    const receiver =
      scorer === Player.Left ? Player.Right : scorer === Player.Right ? Player.Left : null;

    this.lastScore = { ...score };

    if (receiver) {
      this.roundTransitions.push(this.makeGoalFlashTransition(receiver));
    }

    this.roundTransitions.push(this.makeBallSpawnTransition());
  }

  private makeGoalFlashTransition(receivingSide: Player): RoundTransition {
    const interval = 0.08;
    const flashCount = 3;
    const color = this.options.palette.active;

    return new GoalFlashTransition(receivingSide, interval, flashCount, color, (...args) =>
      this.renderActiveCell.call(this, ...args),
    );
  }

  private makeBallSpawnTransition() {
    const duration = 0.55;

    const position = { x: this.boardSize.cols / 2, y: this.boardSize.rows / 2 };
    const color = this.options.palette.active;

    return new BallSpawnTransition(duration, color, position, (...args) =>
      this.renderActiveCell.call(this, ...args),
    );
  }

  private renderRoundTransitions(context: MatrixFrameContext) {
    for (const transition of this.roundTransitions) {
      transition.render(context);
    }
  }

  private updateRoundTransitions(dt: number) {
    if (this.roundTransitions.length === 0) {
      return false;
    }

    this.roundTransitions.forEach((transition) => transition.tick(dt));
    this.roundTransitions = this.roundTransitions.filter((transition) => !transition.finished);

    return this.roundTransitions.length > 0;
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string,
  ) {
    const { cellShape, cellPadding } = this.options;
    const paddingRatio = cellPadding ?? 0.25;
    const radius = (size / 2) * (1 - paddingRatio);
    ctx.fillStyle = color;
    ctx.beginPath();
    if (cellShape === 'circle') {
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    } else {
      ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
    ctx.fill();
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
      const r = cellSize * 0.2;
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      this.drawCell(ctx, x, y, cellSize, color);
    }
  }

  private renderBackground({ ctx, cols, rows, cellSize }: MatrixFrameContext) {
    if (this.options.palette.background) {
      ctx.fillStyle = this.options.palette.background;
      ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);
    }

    const centerCol = Math.floor(cols / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const centerX = c * cellSize + cellSize / 2;
        const centerY = r * cellSize + cellSize / 2;

        if (c === centerCol) {
          if (r % 2 === 0) {
            this.drawCell(ctx, centerX, centerY, cellSize, this.options.palette.inactive);
          }
        } else {
          this.drawCell(ctx, centerX, centerY, cellSize, this.options.palette.inactive);
        }
      }
    }
  }

  private renderPaddle(context: MatrixFrameContext, player: Player, y: number) {
    const { ctx, cols, rows, cellSize } = context;
    if (!this.game) {
      return;
    }

    const color = this.options.palette.active;
    const { paddleWidth, paddleHeight, paddleOffset } = this.game;

    for (let w = 0; w < paddleWidth; w++) {
      for (let h = 0; h < paddleHeight; h++) {
        const row = Math.floor(y) + h;
        const col =
          player === Player.Left ? paddleOffset + w : cols - paddleOffset - paddleWidth + w;

        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          const xPos = col * cellSize + cellSize / 2;
          const yPos = row * cellSize + cellSize / 2;
          this.renderActiveCell(ctx, xPos, yPos, cellSize, color);
        }
      }
    }
  }

  private renderBall(context: MatrixFrameContext) {
    const { ctx, cols, rows, cellSize } = context;
    if (!this.game) {
      return;
    }

    const color = this.options.palette.active;

    if (this.options.snapBallToGrid) {
      const ballCol = Math.floor(this.game.ballX);
      const ballRow = Math.floor(this.game.ballY);
      if (ballCol >= 0 && ballCol < cols && ballRow >= 0 && ballRow < rows) {
        const x = ballCol * cellSize + cellSize / 2;
        const y = ballRow * cellSize + cellSize / 2;
        this.renderActiveCell(ctx, x, y, cellSize, color);
      }
    } else {
      const x = this.game.ballX * cellSize;
      const y = this.game.ballY * cellSize;
      this.renderActiveCell(ctx, x, y, cellSize, color);
    }
  }

  protected renderFrame(context: MatrixFrameContext): void {
    const { dtSec } = context;

    this.ensureGame(context.cols, context.rows);
    if (!this.game) {
      return;
    }

    if (this.keyPresses[Player.Left]) {
      this.game.movePaddle(Player.Left, this.keyPresses[Player.Left], dtSec);
    }

    if (this.options.computerOpponent) {
      this.game.moveComputerPaddle(dtSec);
    } else {
      if (this.keyPresses[Player.Right]) {
        this.game.movePaddle(Player.Right, this.keyPresses[Player.Right], dtSec);
      }
    }

    const transitionsActive = this.updateRoundTransitions(dtSec);

    if (!transitionsActive) {
      this.game.tick(dtSec);
      if (this.game.getIsGameOver()) {
        return;
      }
    }

    this.renderBackground(context);
    this.renderRoundTransitions(context);
    this.renderPaddle(context, Player.Left, this.game.paddleLeftY);
    this.renderPaddle(context, Player.Right, this.game.paddleRightY);
    if (!transitionsActive) {
      this.renderBall(context);
    }
  }
}
