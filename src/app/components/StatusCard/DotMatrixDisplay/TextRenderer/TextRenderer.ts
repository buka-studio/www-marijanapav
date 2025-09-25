import { BaseRenderer } from '../BaseRenderer';
import type { MatrixFrameContext, Palette } from '../MatrixRenderer';
import defaultFontData from './bitmapFont.json';
import { BitmapFont } from './models';
import { decodeBitmapFont } from './util';

type Options = {
  text: string;
  font?: BitmapFont;
  speed?: number;
  charSpacing: number;
  palette?: Palette;
  cellShape?: CellShape;
  glow?: boolean;
  cellPadding?: number;
  fps?: number;
};

type CellShape = 'circle' | 'square';

export default class TextRenderer extends BaseRenderer {
  private chars!: { width: number; data: number[] }[];
  private fontHeight!: number;
  private bitmapWidth!: number;

  private options!: Options;
  private cursorOffset: number = 0;
  private lastFrameProcessed: number | null = null;
  private accMs: number = 0;
  private targetIntervalMs: number = 0;

  constructor(options: Partial<Options> & { text: string }) {
    super();
    this.options = {
      speed: 10,
      charSpacing: 1,
      cellShape: 'circle',
      glow: false,
      cellPadding: 0.25,

      ...options,
      font: options.font || decodeBitmapFont(JSON.stringify(defaultFontData)),
    };

    this.initFont(this.options.font!);
    this.targetIntervalMs = 1000 / (this.options.fps ?? 30);
  }

  private initFont(font: BitmapFont) {
    const { text, charSpacing } = this.options;
    this.chars = Array.from(text).map((ch) => font.chars[ch] || font.chars['DEFAULT']);
    this.fontHeight = Math.max(...this.chars.map((c) => c.data.length));
    this.bitmapWidth = this.chars.reduce((acc, c) => acc + c.width + charSpacing, 0);
  }

  public setPalette(palette: Palette) {
    this.options.palette = {
      ...this.options.palette,
      ...palette,
    };
  }

  public setText(text: string) {
    this.options.text = text;
    this.initFont(this.options.font!);
    this.cursorOffset = 0;
  }

  private drawCell({
    ctx,
    col,
    row,
    glow,
    color,
    cellSize,
  }: {
    ctx: CanvasRenderingContext2D;
    col: number;
    row: number;
    glow: boolean;
    color: string;
    cellSize: number;
  }) {
    const { cellPadding, cellShape } = this.options;
    const centerX = col * cellSize + cellSize / 2;
    const centerY = row * cellSize + cellSize / 2;
    const radius = cellSize / 2 - (cellPadding ?? 0);

    const drawGlow = glow && this.options.glow;

    if (drawGlow) {
      ctx.save();
      ctx.shadowBlur = cellSize * 1.5;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      if (cellShape === 'circle') {
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      } else {
        ctx.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
      }
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      if (cellShape === 'circle') {
        ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI);
      } else {
        const r = radius * 0.5;
        ctx.rect(centerX - r, centerY - r, r * 2, r * 2);
      }
      ctx.fill();
      return;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    if (cellShape === 'circle') {
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    } else {
      ctx.rect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    }
    ctx.fill();
  }

  protected renderFrame(context: MatrixFrameContext): void {
    const { ctx, cols, rows, cellSize, frame, dtSec } = context;
    const { palette, charSpacing } = this.options;

    this.accMs += dtSec * 1000;

    if (this.accMs < this.targetIntervalMs) {
      return;
    }
    this.accMs -= this.targetIntervalMs;

    if (this.lastFrameProcessed !== frame) {
      this.cursorOffset += this.options.speed ?? 0;
      this.lastFrameProcessed = frame;
    }

    if (palette?.background) {
      ctx.fillStyle = palette.background;
      ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.drawCell({
          ctx,
          col: c,
          row: r,
          glow: false,
          color: palette?.inactive ?? '#000000',
          cellSize,
        });
      }
    }

    if (rows < this.fontHeight) {
      return;
    }

    const normalizedOffset =
      ((this.cursorOffset % this.bitmapWidth) + this.bitmapWidth) % this.bitmapWidth;
    const firstStart = normalizedOffset - this.bitmapWidth;

    for (let base = firstStart; base < cols + this.bitmapWidth; base += this.bitmapWidth) {
      let cursor = base;
      for (const ch of this.chars) {
        const w = ch.width;
        for (let y = 0; y < this.fontHeight; y++) {
          const rowBits = ch.data[y];
          for (let x = 0; x < w; x++) {
            const isActive = (rowBits >> (w - 1 - x)) & 1;
            if (!isActive) {
              continue;
            }

            const col = cursor + x;
            const row = y;
            if (col >= 0 && col < cols && row >= 0 && row < rows) {
              this.drawCell({
                ctx,
                col,
                row,
                glow: true,
                color: palette?.active ?? '#000000',
                cellSize,
              });
            }
          }
        }

        cursor += w + charSpacing;
      }
    }
  }
}
