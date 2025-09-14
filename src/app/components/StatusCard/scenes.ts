import { SystemMetrics } from '~/src/lib/models';
import { remap } from '~/src/math';

import { MatrixFrameContext, MatrixRenderer, Palette } from './models';
import PongGameRenderer, { Player, PongDirection } from './PongGameRenderer';
import SnakeGameRenderer, { Direction } from './SnakeGameRenderer';
import TextRenderer from './TextRenderer';

export type SceneMap = {
  [key in SceneName]: MatrixRenderer;
};

export interface SceneContext {
  dotMatrixDisplayRef: React.RefObject<{ getFrameContext: () => MatrixFrameContext }>;
  containerRef: React.RefObject<HTMLDivElement>;
  palette: Palette;
  metrics: SystemMetrics;
  onScoreChange: (score: { player1: number; player2?: number }) => void;
  onGameEnd: () => void;
  onGameSelect: (game: 'snake' | 'pong') => void;
  analytics: {
    track: (event: string, data?: any) => void;
  };
}

export abstract class Scene {
  constructor(
    public renderer: MatrixRenderer,
    protected context: SceneContext,
  ) {}

  public setupControls(): void {}
  public cleanupControls(): void {}
}

export class TextScene extends Scene {
  constructor(context: SceneContext) {
    const memoryMB = Math.round(context.metrics.memory.usedBytes / 1024 / 1024);
    const memoryText =
      context.metrics.memory.usedPct === 0 ? `${memoryMB}MB` : `${context.metrics.memory.usedPct}%`;
    const text = ` CPU:${context.metrics.cpu.percent}% • MEMORY:${memoryText} • STATUS:${context.metrics.status.toUpperCase()} •`;

    const renderer = new TextRenderer({
      text: text,
      speed: -1,
      charSpacing: 1,
      glow: true,
      cellShape: 'circle',
      cellPadding: 0.25,
      fps: 10,
      palette: context.palette,
    });
    super(renderer, context);
  }
}

export class MenuScene extends Scene {
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor(context: SceneContext) {
    const renderer = new TextRenderer({
      text: '1: SNAKE   2: PONG  ',
      speed: -1,
      charSpacing: 1,
      glow: true,
      cellShape: 'circle',
      cellPadding: 0.25,
      fps: 10,
      palette: context.palette,
    });
    super(renderer, context);

    const menuGameMap = {
      '1': 'snake',
      '2': 'pong',
    } as const;

    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in menuGameMap) {
        e.preventDefault();

        this.context.onGameSelect(menuGameMap[e.key as keyof typeof menuGameMap]);
      }
    };
  }

  setupControls() {
    this.context.containerRef.current?.addEventListener('keydown', this.handleKeyDown);
  }

  cleanupControls() {
    this.context.containerRef.current?.removeEventListener('keydown', this.handleKeyDown);
  }
}

export class SnakeScene extends Scene {
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor(context: SceneContext) {
    const snakeFps = Math.round(
      remap(context.containerRef?.current?.clientWidth ?? 0, 0, 1280, 20, 40),
    );
    const renderer = new SnakeGameRenderer({
      glow: true,
      fps: snakeFps,
      palette: context.palette,
      onScoreChange: (score) => context.onScoreChange({ player1: score }),
      onGameOver: (score) => this.handleGameOver(score),
    });
    super(renderer, context);

    const directionMap = {
      w: Direction.Up,
      ArrowUp: Direction.Up,
      s: Direction.Down,
      ArrowDown: Direction.Down,
      a: Direction.Left,
      ArrowLeft: Direction.Left,
      d: Direction.Right,
      ArrowRight: Direction.Right,
    } as const;

    this.handleKeyDown = (e: KeyboardEvent) => {
      const snakeRenderer = this.renderer as SnakeGameRenderer;

      if (e.key in directionMap) {
        e.preventDefault();
        snakeRenderer.enqueueDirection(directionMap[e.key as keyof typeof directionMap]);
      }
    };
  }

  handleGameOver(score: number) {
    this.context.analytics.track('snake_game_over', { score });
    this.context.onGameEnd();
  }

  setupControls() {
    this.context.containerRef.current?.addEventListener('keydown', this.handleKeyDown);
  }

  cleanupControls() {
    this.context.containerRef.current?.removeEventListener('keydown', this.handleKeyDown);
  }
}

export class PongScene extends Scene {
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;

  constructor(context: SceneContext) {
    const renderer = new PongGameRenderer({
      palette: context.palette,
      maxScore: 5,
      snapBallToGrid: true,
      cellShape: 'circle',
      computerOpponent: true,
      glow: true,
      onScoreChange: (score) =>
        context.onScoreChange({ player1: score.left, player2: score.right }),
      onGameOver: (score) => this.handleGameOver(score),
    });
    super(renderer, context);

    const directionMap = {
      w: PongDirection.Up,
      ArrowUp: PongDirection.Up,
      s: PongDirection.Down,
      ArrowDown: PongDirection.Down,
    } as const;

    this.handleKeyDown = (e: KeyboardEvent) => {
      const pongRenderer = this.renderer as PongGameRenderer;
      if (e.key in directionMap) {
        e.preventDefault();
        pongRenderer.setKeyPress(Player.Left, directionMap[e.key as keyof typeof directionMap]);
      }
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      const pongRenderer = this.renderer as PongGameRenderer;
      if (e.key in directionMap) {
        e.preventDefault();
        pongRenderer.setKeyPress(Player.Left, null);
      }
    };
  }

  handleGameOver(score: { left: number; right: number }) {
    this.context.analytics.track('pong_game_over', { score });
    this.context.onGameEnd();
  }

  setupControls() {
    this.context.containerRef.current?.addEventListener('keydown', this.handleKeyDown);
    this.context.containerRef.current?.addEventListener('keyup', this.handleKeyUp);
  }

  cleanupControls() {
    this.context.containerRef.current?.removeEventListener('keydown', this.handleKeyDown);
    this.context.containerRef.current?.removeEventListener('keyup', this.handleKeyUp);
  }
}

export const scenes = {
  status: TextScene,
  menu: MenuScene,
  snake: SnakeScene,
  pong: PongScene,
};

export type SceneName = keyof typeof scenes;
