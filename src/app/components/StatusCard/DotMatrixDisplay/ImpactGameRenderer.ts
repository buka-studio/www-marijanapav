import { BaseRenderer } from './BaseRenderer';
import type { MatrixFrameContext, Palette } from './MatrixRenderer';

type CellShape = 'circle' | 'square';

type ControlState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

export enum PlayerAction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
  Shoot = 'shoot',
}

interface Bullet {
  col: number;
  row: number;
  speed: number;
  progress: number;
}

type AsteroidCell = {
  dx: number;
  dy: number;
};

interface Asteroid {
  id: number;
  col: number;
  row: number;
  width: number;
  height: number;
  cells: AsteroidCell[];
  hp: number;
  speed: number;
  progress: number;
}

interface Star {
  col: number;
  row: number;
  speed: number;
  progress: number;
  phase: number;
}

interface PlayerState {
  col: number;
  row: number;
  width: number;
  height: number;
  cells: AsteroidCell[];
}

interface SpaceImpactGameOptions {
  width: number;
  height: number;
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

type AsteroidBlueprint = {
  data: string[];
  baseSpeed: number;
};

const cellsFromData = (data: string[]): AsteroidCell[] => {
  const cells: AsteroidCell[] = [];
  data.forEach((row, rowIdx) => {
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      if (row[colIdx] === '1') {
        cells.push({ dx: colIdx, dy: rowIdx });
      }
    }
  });
  return cells;
};

const normalizeCells = (cells: AsteroidCell[]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const cell of cells) {
    minX = Math.min(minX, cell.dx);
    minY = Math.min(minY, cell.dy);
    maxX = Math.max(maxX, cell.dx);
    maxY = Math.max(maxY, cell.dy);
  }
  const normalized = cells.map(({ dx, dy }) => ({ dx: dx - minX, dy: dy - minY }));
  return {
    cells: normalized,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
};

const ASTEROID_BLUEPRINTS: AsteroidBlueprint[] = [
  { data: ['01', '11'], baseSpeed: 0.54 },
  { data: ['011', '111', '110'], baseSpeed: 0.5 },
  { data: ['00110', '01111', '11111', '01111', '00111'], baseSpeed: 0.42 },
  {
    data: ['0001100', '0011110', '0111111', '1111111', '0111110', '0011100'],
    baseSpeed: 0.32,
  },
];

const PLAYER_TEMPLATE = normalizeCells(cellsFromData(['0110', '0111', '0110']));

const PLAYER_SHAPE = PLAYER_TEMPLATE.cells;
const PLAYER_WIDTH = PLAYER_TEMPLATE.width;
const PLAYER_HEIGHT = PLAYER_TEMPLATE.height;
const PLAYER_CENTRE_ROW = Math.floor(PLAYER_HEIGHT / 2);
const PLAYER_NOSE = PLAYER_SHAPE.reduce((best, cell) => {
  if (!best) {
    return cell;
  }
  if (cell.dx > best.dx) {
    return cell;
  }
  if (cell.dx === best.dx) {
    const bestDist = Math.abs(best.dy - PLAYER_CENTRE_ROW);
    const cellDist = Math.abs(cell.dy - PLAYER_CENTRE_ROW);
    if (cellDist < bestDist) {
      return cell;
    }
  }
  return best;
}, PLAYER_SHAPE[0]);
const PLAYER_BULLET_COL_OFFSET = PLAYER_NOSE.dx + 1;
const PLAYER_BULLET_ROW_OFFSET = PLAYER_NOSE.dy;

class SpaceImpactGame {
  private width: number;
  private height: number;
  private onScoreChange?: (score: number) => void;
  private onGameOver?: (score: number) => void;

  private readonly tickIntervalSec = 0.08;

  private accumulatorSec = 0;
  private nextAsteroidId = 0;
  private shootCooldownSteps = 0;
  private spawnCooldownSteps = 0;
  private elapsedTimeSec = 0;
  private shootQueued = false;

  private player: PlayerState = {
    col: 1,
    row: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    cells: PLAYER_SHAPE,
  };
  private controls: ControlState = { up: false, down: false, left: false, right: false };

  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private stars: Star[] = [];

  private score = 0;
  private gameOver = false;

  constructor(options: SpaceImpactGameOptions) {
    this.width = options.width;
    this.height = options.height;
    this.onScoreChange = options.onScoreChange;
    this.onGameOver = options.onGameOver;
    this.reset();
  }

  public reset(width = this.width, height = this.height) {
    this.width = width;
    this.height = height;

    this.player = {
      col: 1,
      row: Math.max(0, Math.floor((height - PLAYER_HEIGHT) / 2)),
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      cells: PLAYER_SHAPE,
    };

    this.bullets = [];
    this.asteroids = [];
    this.stars = this.createStarField();

    this.score = 0;
    this.gameOver = false;
    this.accumulatorSec = 0;
    this.shootCooldownSteps = 0;
    this.spawnCooldownSteps = 0;
    this.nextAsteroidId = 0;
    this.elapsedTimeSec = 0;
    this.shootQueued = false;
    this.controls = { up: false, down: false, left: false, right: false };

    this.onScoreChange?.(this.score);
  }

  public update(dtSec: number, controls: ControlState) {
    this.controls = controls;
    this.accumulatorSec += dtSec;

    while (this.accumulatorSec >= this.tickIntervalSec) {
      this.tick();
      this.accumulatorSec -= this.tickIntervalSec;
    }

    this.updateStars(dtSec);
  }

  public queueShot() {
    if (this.gameOver) {
      return;
    }
    this.shootQueued = true;
  }

  public getState() {
    return {
      player: this.player,
      bullets: this.bullets,
      asteroids: this.asteroids,
      stars: this.stars,
      score: this.score,
      gameOver: this.gameOver,
    };
  }

  public getWidth() {
    return this.width;
  }

  public getHeight() {
    return this.height;
  }

  private tick() {
    if (this.gameOver) {
      return;
    }

    this.elapsedTimeSec += this.tickIntervalSec;
    this.updatePlayerPosition();
    this.processShotQueue();
    this.updateBullets();
    this.updateAsteroids();
    this.applyCollisions();
    this.pruneEntities();
    this.scheduleSpawn();
  }

  private updatePlayerPosition() {
    const verticalDelta = (this.controls.up ? -1 : 0) + (this.controls.down ? 1 : 0);
    const horizontalDelta = (this.controls.left ? -1 : 0) + (this.controls.right ? 1 : 0);

    if (verticalDelta !== 0) {
      const minRow = -Math.floor(this.player.height / 2);
      const maxRow = this.height - Math.ceil(this.player.height / 2);
      const nextRow = Math.max(minRow, Math.min(maxRow, this.player.row + verticalDelta));
      this.player.row = nextRow;
    }

    if (horizontalDelta !== 0) {
      const minCol = 0;
      const maxCol = Math.max(0, this.width - PLAYER_BULLET_COL_OFFSET - 1);
      const nextCol = Math.max(minCol, Math.min(maxCol, this.player.col + horizontalDelta));
      this.player.col = nextCol;
    }
  }

  private processShotQueue() {
    if (this.shootCooldownSteps > 0) {
      this.shootCooldownSteps -= 1;
    }

    if (!this.shootQueued || this.shootCooldownSteps > 0) {
      return;
    }

    const bulletCol = this.player.col + PLAYER_BULLET_COL_OFFSET;
    if (bulletCol < 0 || bulletCol >= this.width) {
      this.shootQueued = false;
      return;
    }

    const unclampedRow = this.player.row + PLAYER_BULLET_ROW_OFFSET;
    const bulletRow = Math.max(0, Math.min(this.height - 1, unclampedRow));

    this.bullets.push({
      col: bulletCol,
      row: bulletRow,
      speed: 1.25,
      progress: 0,
    });
    this.shootCooldownSteps = 2;
    this.shootQueued = false;
  }

  private updateBullets() {
    for (const bullet of this.bullets) {
      bullet.progress += bullet.speed;
      while (bullet.progress >= 1) {
        bullet.col += 1;
        bullet.progress -= 1;
      }
    }
  }

  private updateAsteroids() {
    const speedMultiplier = 1 + Math.min(0.6, this.elapsedTimeSec * 0.01);
    for (const asteroid of this.asteroids) {
      asteroid.progress += asteroid.speed * speedMultiplier;
      while (asteroid.progress >= 1) {
        asteroid.col -= 1;
        asteroid.progress -= 1;
      }
    }
  }

  private applyCollisions() {
    const bulletsToRemove = new Set<number>();

    for (let bulletIdx = 0; bulletIdx < this.bullets.length; bulletIdx++) {
      const bullet = this.bullets[bulletIdx];
      for (const asteroid of this.asteroids) {
        if (asteroid.hp <= 0) {
          continue;
        }
        let hit = false;
        for (const cell of asteroid.cells) {
          const cellCol = asteroid.col + cell.dx;
          const cellRow = asteroid.row + cell.dy;
          if (bullet.col === cellCol && bullet.row === cellRow) {
            hit = true;
            break;
          }
        }
        if (hit) {
          asteroid.hp -= 1;
          bulletsToRemove.add(bulletIdx);
          if (asteroid.hp <= 0) {
            const size = asteroid.cells.length;
            this.score += size * 2;
            this.onScoreChange?.(this.score);
          }
          break;
        }
      }
    }

    if (bulletsToRemove.size > 0) {
      this.bullets = this.bullets.filter((_, idx) => !bulletsToRemove.has(idx));
    }

    const playerCells = this.player.cells;

    for (const asteroid of this.asteroids) {
      if (asteroid.hp <= 0) {
        continue;
      }
      for (const cell of asteroid.cells) {
        const cellCol = asteroid.col + cell.dx;
        const cellRow = asteroid.row + cell.dy;
        for (const playerCell of playerCells) {
          const playerCol = this.player.col + playerCell.dx;
          const playerRow = this.player.row + playerCell.dy;
          if (
            playerCol < 0 ||
            playerCol >= this.width ||
            playerRow < 0 ||
            playerRow >= this.height
          ) {
            continue;
          }
          if (cellCol === playerCol && cellRow === playerRow) {
            this.triggerGameOver();
            return;
          }
        }
      }
    }
  }

  private pruneEntities() {
    this.bullets = this.bullets.filter((bullet) => bullet.col < this.width + 1);
    this.asteroids = this.asteroids.filter(
      (asteroid) => asteroid.hp > 0 || asteroid.col + asteroid.width > 0,
    );
  }

  private scheduleSpawn() {
    if (this.spawnCooldownSteps > 0) {
      this.spawnCooldownSteps -= 1;
      return;
    }

    this.spawnAsteroid();
    const baseCooldown = 10;
    const minCooldown = 5;
    const cooldown = Math.max(minCooldown, Math.round(baseCooldown - this.score * 0.1));
    this.spawnCooldownSteps = cooldown;
  }

  private spawnAsteroid() {
    const variant = this.pickAsteroidVariant();

    const normalized = normalizeCells(variant.cells.map((cell) => ({ ...cell })));

    const width = normalized.width;
    const height = normalized.height;

    const maxStartRow = Math.max(0, this.height - height);
    const row = Math.floor(Math.random() * (maxStartRow + 1));
    const col = this.width + width;

    const baseSpeed = variant.baseSpeed;
    const speed = Math.max(0.25, baseSpeed + Math.random() * 0.15);
    const hp = Math.max(1, Math.ceil(normalized.cells.length / 2));

    this.asteroids.push({
      id: this.nextAsteroidId++,
      col,
      row,
      width,
      height,
      cells: normalized.cells,
      hp,
      speed,
      progress: 0,
    });
  }

  private pickAsteroidVariant() {
    const attempts = 8;
    for (let i = 0; i < attempts; i++) {
      const blueprint = ASTEROID_BLUEPRINTS[Math.floor(Math.random() * ASTEROID_BLUEPRINTS.length)];
      const normalized = normalizeCells(cellsFromData(blueprint.data));
      if (normalized.height <= this.height) {
        return { ...normalized, baseSpeed: blueprint.baseSpeed };
      }
    }

    const fallbackCells: AsteroidCell[] = [{ dx: 0, dy: 0 }];
    const normalizedFallback = normalizeCells(fallbackCells);
    return { ...normalizedFallback, baseSpeed: 0.5 };
  }

  private createStarField(): Star[] {
    const density = Math.max(10, Math.round(this.width * this.height * 0.12));
    return Array.from({ length: density }, () => ({
      col: Math.floor(Math.random() * this.width),
      row: Math.floor(Math.random() * this.height),
      speed: 0.35 + Math.random() * 0.35,
      progress: Math.random(),
      phase: Math.random() * Math.PI * 2,
    }));
  }

  private updateStars(dtSec: number) {
    for (const star of this.stars) {
      star.progress += star.speed * dtSec;
      while (star.progress >= 1) {
        star.col -= 1;
        star.progress -= 1;
      }
      if (star.col < -1) {
        star.col = this.width + Math.floor(Math.random() * 3);
        star.row = Math.floor(Math.random() * this.height);
        star.progress = Math.random();
      }
      star.phase += dtSec * 2.5;
      if (star.phase > Math.PI * 2) {
        star.phase -= Math.PI * 2;
      }
    }
  }

  private triggerGameOver() {
    if (this.gameOver) {
      return;
    }
    this.gameOver = true;
    this.onGameOver?.(this.score);
  }
}

interface RendererOptions {
  palette: Palette;
  glow?: boolean;
  cellShape?: CellShape;
  cellPadding?: number;
  onScoreChange?: (score: number) => void;
  onGameOver?: (score: number) => void;
}

export default class ImpactGameRenderer extends BaseRenderer {
  private options: RendererOptions;
  private controls: ControlState = { up: false, down: false, left: false, right: false };
  private game: SpaceImpactGame | null = null;
  private pendingShot = false;

  constructor(options: RendererOptions) {
    super();
    this.options = {
      glow: true,
      cellShape: 'circle',
      cellPadding: 0.25,
      ...options,
    };
  }

  public restart() {
    this.pendingShot = false;
    this.game?.reset();
  }

  public setActionState(action: PlayerAction, active: boolean) {
    switch (action) {
      case PlayerAction.Up:
        this.controls.up = active;
        break;
      case PlayerAction.Down:
        this.controls.down = active;
        break;
      case PlayerAction.Left:
        this.controls.left = active;
        break;
      case PlayerAction.Right:
        this.controls.right = active;
        break;
      case PlayerAction.Shoot:
        if (active) {
          if (this.game) {
            this.game.queueShot();
          } else {
            this.pendingShot = true;
          }
        } else if (!this.game) {
          this.pendingShot = false;
        }
        break;
    }
  }

  public setPalette(palette: Palette) {
    this.options.palette = { ...this.options.palette, ...palette };
  }

  protected renderFrame(context: MatrixFrameContext) {
    this.ensureGame(context.cols, context.rows);
    if (this.pendingShot && this.game) {
      this.game.queueShot();
      this.pendingShot = false;
    }
    this.game?.update(context.dtSec, this.controls);

    const { ctx, cols, rows, cellSize } = context;
    ctx.clearRect(0, 0, cols * cellSize, rows * cellSize);

    this.renderBackground(context);
    const state = this.game?.getState();
    if (!state) {
      return;
    }

    this.renderStars(context, state.stars);
    this.renderAsteroids(context, state.asteroids);
    this.renderBullets(context, state.bullets);
    this.renderPlayer(context, state.player, state.gameOver);
  }

  private ensureGame(cols: number, rows: number) {
    if (!this.game || this.game.getWidth() !== cols || this.game.getHeight() !== rows) {
      this.game = new SpaceImpactGame({
        width: cols,
        height: rows,
        onScoreChange: this.options.onScoreChange,
        onGameOver: this.options.onGameOver,
      });
    }
  }

  private renderBackground({ ctx, cols, rows, cellSize }: MatrixFrameContext) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        this.drawCell(ctx, x, y, cellSize, this.options.palette.inactive, false);
      }
    }
  }

  private renderStars(context: MatrixFrameContext, stars: Star[]) {
    const { ctx, cellSize } = context;
    ctx.save();

    for (const star of stars) {
      const x = star.col * cellSize + cellSize / 2;
      const y = star.row * cellSize + cellSize / 2;
      const brightness = 0.5 + Math.sin(star.phase) * 0.4;
      ctx.globalAlpha = brightness;
      this.drawCell(ctx, x, y, cellSize * 0.4, this.options.palette.active, false);
    }
    ctx.restore();
  }

  private renderPlayer(context: MatrixFrameContext, player: PlayerState, gameOver: boolean) {
    const { ctx, cellSize } = context;
    const color = this.options.palette.active;
    ctx.save();

    for (const cell of player.cells) {
      const col = player.col + cell.dx;
      const row = player.row + cell.dy;
      if (col < 0 || col >= context.cols || row < 0 || row >= context.rows) {
        continue;
      }
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;
      this.drawCell(ctx, x, y, cellSize, color, true);
    }

    const noseCol = player.col + PLAYER_NOSE.dx;
    const noseRow = player.row + PLAYER_NOSE.dy;
    if (noseCol >= 0 && noseCol < context.cols && noseRow >= 0 && noseRow < context.rows) {
      const noseX = noseCol * cellSize + cellSize / 2;
      const noseY = noseRow * cellSize + cellSize / 2;
      if (noseCol + 1 < context.cols) {
        const aheadX = (noseCol + 1) * cellSize + cellSize / 2;
        this.drawCell(ctx, aheadX, noseY, cellSize * 0.55, color, true);
      }

      if (gameOver) {
        ctx.globalAlpha = 0.35;
        this.drawCell(ctx, noseX, noseY, cellSize * 1.8, color, true);
      }
    }
    ctx.restore();
  }

  private renderAsteroids(context: MatrixFrameContext, asteroids: Asteroid[]) {
    const { ctx, cellSize } = context;
    const color = this.options.palette.active;
    for (const asteroid of asteroids) {
      if (asteroid.hp <= 0) {
        continue;
      }
      const halfWidth = asteroid.width / 2;
      const halfHeight = asteroid.height / 2;
      const maxDistance = Math.max(0.5, Math.hypot(halfWidth, halfHeight));
      for (const cell of asteroid.cells) {
        const col = asteroid.col + cell.dx;
        const row = asteroid.row + cell.dy;
        if (col < 0 || col >= context.cols || row < 0 || row >= context.rows) {
          continue;
        }
        const localX = cell.dx + 0.5 - halfWidth;
        const localY = cell.dy + 0.5 - halfHeight;
        const distance = Math.hypot(localX, localY);
        const depth = 1 - Math.min(1, distance / maxDistance);
        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;
        this.renderAsteroidCell(ctx, x, y, cellSize, color, depth, localX, localY, maxDistance);
      }
    }
  }

  private renderBullets(context: MatrixFrameContext, bullets: Bullet[]) {
    const { ctx, cellSize } = context;
    ctx.save();
    for (const bullet of bullets) {
      if (
        bullet.col < 0 ||
        bullet.col >= context.cols ||
        bullet.row < 0 ||
        bullet.row >= context.rows
      ) {
        continue;
      }
      const x = bullet.col * cellSize + cellSize / 2;
      const y = bullet.row * cellSize + cellSize / 2;
      this.drawCell(ctx, x, y, cellSize * 0.75, this.options.palette.active, true);
    }
    ctx.restore();
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    color: string,
    glow: boolean,
  ) {
    const { cellShape, cellPadding } = this.options;
    const paddingRatio = cellPadding ?? 0.25;
    const radius = (size / 2) * (1 - paddingRatio);

    ctx.save();
    ctx.fillStyle = color;
    if (glow && this.options.glow) {
      ctx.shadowBlur = size * 0.9;
      ctx.shadowColor = color;
    }
    ctx.beginPath();
    if (cellShape === 'circle') {
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    } else {
      ctx.rect(cx - radius, cy - radius, radius * 2, radius * 2);
    }
    ctx.fill();
    ctx.restore();
  }

  private renderAsteroidCell(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    cellSize: number,
    color: string,
    depth: number,
    localX: number,
    localY: number,
    maxDistance: number,
  ) {
    const { cellShape, cellPadding } = this.options;
    const paddingRatio = cellPadding ?? 0.25;

    const shadowRadius = (cellSize / 2) * (1 - Math.max(0, paddingRatio - 0.05));
    const rimStrength = 1 - depth;
    const shadowAlpha = 0.55 + rimStrength * 0.45;
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    if (cellShape === 'circle') {
      ctx.arc(cx, cy, shadowRadius, 0, Math.PI * 2);
    } else {
      ctx.rect(cx - shadowRadius, cy - shadowRadius, shadowRadius * 2, shadowRadius * 2);
    }
    ctx.fill();
    ctx.restore();

    const oldAlpha = ctx.globalAlpha;
    const bodyAlpha = 0.4 + depth * 0.55;
    ctx.globalAlpha = bodyAlpha;
    this.drawCell(ctx, cx, cy, cellSize * 0.8, color, true);
    ctx.globalAlpha = oldAlpha;

    const lightDirX = -0.6;
    const lightDirY = -0.8;
    const norm = Math.hypot(lightDirX, lightDirY) || 1;
    const lightFactor = (localX * lightDirX + localY * lightDirY) / (maxDistance * norm);
    const highlight = Math.max(0, lightFactor);

    if (highlight > 0.02) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + highlight * 0.4})`;
      ctx.beginPath();
      const highlightRadius = cellSize * (0.2 + depth * 0.15);
      ctx.arc(cx - cellSize * 0.18, cy - cellSize * 0.2, highlightRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
