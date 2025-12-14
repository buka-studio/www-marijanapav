import { SystemMetrics } from '~/src/lib/models';
import { remap } from '~/src/math';

import ImpactGameRenderer, { PlayerAction } from './ImpactGameRenderer';
import { MatrixFrameContext, MatrixRenderer, Palette } from './MatrixRenderer';
import PongGameSceneRenderer, { Player, PongDirection } from './PongGameRenderer';
import SnakeGameRenderer, { Direction } from './SnakeGameRenderer';
import TextRenderer from './TextRenderer';

export type SceneMap = {
  [key in SceneName]: MatrixRenderer;
};

export interface SceneContext {
  dotMatrixDisplayRef: React.RefObject<{ getFrameContext: () => MatrixFrameContext } | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  palette: Palette;
  metrics: SystemMetrics;
  onScoreChange: (score: { player1: number; player2?: number }) => void;
  onGameEnd: () => void;
  onGameSelect: (game: 'snake' | 'pong' | 'impact') => void;
  analytics: {
    track: (event: string, data?: any) => void;
  };
}

export abstract class Scene {
  constructor(
    public readonly renderer: MatrixRenderer,
    protected context: SceneContext,
    public readonly instructions: string,
  ) {}

  public setupControls(): void {}
  public cleanupControls(): void {}
}

export class StatusScene extends Scene {
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
    super(renderer, context, text);
  }
}

export class MenuScene extends Scene {
  private handleKeyDown: (e: KeyboardEvent) => void;

  constructor(context: SceneContext) {
    const renderer = new TextRenderer({
      text: '1:SNAKE   2:PONG   3:IMPACT  ',
      speed: -1,
      charSpacing: 1,
      glow: true,
      cellShape: 'circle',
      cellPadding: 0.25,
      fps: 10,
      palette: context.palette,
    });
    super(renderer, context, 'Game Select: 1:Snake 2:Pong 3:Impact');

    const menuGameMap = {
      '1': 'snake',
      '2': 'pong',
      '3': 'impact',
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
    super(
      renderer,
      context,
      'Snake: W, A, S, D or Arrow keys to move. Escape to exit. Use Tab to leave this area.',
    );

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

export class PongGameScene extends Scene {
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;

  constructor(context: SceneContext) {
    const renderer = new PongGameSceneRenderer({
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
    super(
      renderer,
      context,
      'Pong: W, S or Arrow keys to move. Escape to exit. Use Tab to leave this area.',
    );

    const directionMap = {
      w: PongDirection.Up,
      ArrowUp: PongDirection.Up,
      s: PongDirection.Down,
      ArrowDown: PongDirection.Down,
    } as const;

    this.handleKeyDown = (e: KeyboardEvent) => {
      const pongRenderer = this.renderer as PongGameSceneRenderer;
      if (e.key in directionMap) {
        e.preventDefault();
        pongRenderer.setKeyPress(Player.Left, directionMap[e.key as keyof typeof directionMap]);
      }
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      const pongRenderer = this.renderer as PongGameSceneRenderer;
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

export class ImpactGameScene extends Scene {
  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;

  constructor(context: SceneContext) {
    const renderer = new ImpactGameRenderer({
      palette: context.palette,
      glow: true,
      onScoreChange: (score) => context.onScoreChange({ player1: score }),
      onGameOver: (score) => this.handleGameOver(score),
    });
    super(
      renderer,
      context,
      'Impact: W, S, A, D or Arrow keys to move. Space to shoot. Escape to exit. Use Tab to leave this area.',
    );

    const keyMap: Record<string, PlayerAction> = {
      w: PlayerAction.Up,
      W: PlayerAction.Up,
      ArrowUp: PlayerAction.Up,
      s: PlayerAction.Down,
      S: PlayerAction.Down,
      ArrowDown: PlayerAction.Down,
      a: PlayerAction.Left,
      A: PlayerAction.Left,
      ArrowLeft: PlayerAction.Left,
      d: PlayerAction.Right,
      D: PlayerAction.Right,
      ArrowRight: PlayerAction.Right,
      ' ': PlayerAction.Shoot,
      Space: PlayerAction.Shoot,
      Spacebar: PlayerAction.Shoot,
    };

    const keyToAction = (event: KeyboardEvent): PlayerAction | null => {
      if (event.key in keyMap) {
        return keyMap[event.key as keyof typeof keyMap];
      }
      if (event.code === 'Space') {
        return PlayerAction.Shoot;
      }
      return null;
    };

    this.handleKeyDown = (e: KeyboardEvent) => {
      const impactRenderer = this.renderer as ImpactGameRenderer;
      const action = keyToAction(e);
      if (action) {
        if (action === PlayerAction.Shoot && e.repeat) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        impactRenderer.setActionState(action, true);
      }
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      const impactRenderer = this.renderer as ImpactGameRenderer;
      const action = keyToAction(e);
      if (action) {
        e.preventDefault();
        impactRenderer.setActionState(action, false);
      }
    };
  }

  private handleGameOver(score: number) {
    this.context.analytics.track('impact_game_over', { score });
    this.context.onGameEnd();
  }

  override setupControls() {
    const container = this.context.containerRef.current;
    container?.addEventListener('keydown', this.handleKeyDown);
    container?.addEventListener('keyup', this.handleKeyUp);
  }

  override cleanupControls() {
    const container = this.context.containerRef.current;
    container?.removeEventListener('keydown', this.handleKeyDown);
    container?.removeEventListener('keyup', this.handleKeyUp);
  }
}

export const scenes = {
  status: StatusScene,
  menu: MenuScene,
  snake: SnakeScene,
  pong: PongGameScene,
  impact: ImpactGameScene,
};

export type SceneName = keyof typeof scenes;
