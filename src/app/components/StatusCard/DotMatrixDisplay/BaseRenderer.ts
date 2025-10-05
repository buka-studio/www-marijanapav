import { MatrixFrameContext, MatrixRenderer } from './MatrixRenderer';

export abstract class BaseRenderer implements MatrixRenderer {
  private paused = false;
  private initialized = false;
  private virtualTimeSec = 0;
  private virtualFrame = 0;

  public pause(): void {
    this.paused = true;
  }

  public resume(): void {
    this.paused = false;
  }

  public render(ctx: MatrixFrameContext): void {
    if (!this.initialized) {
      this.virtualTimeSec = ctx.timeSec;
      this.virtualFrame = ctx.frame;
      this.initialized = true;
    }

    if (this.paused) {
      return;
    }

    this.virtualTimeSec += ctx.dtSec;
    this.virtualFrame += 1;

    const effective: MatrixFrameContext = {
      ...ctx,
      timeSec: this.virtualTimeSec,
      dtSec: this.paused ? 0 : ctx.dtSec,
      frame: this.virtualFrame,
    };

    this.renderFrame(effective);
  }

  public abstract setPalette(palette: { active: string; inactive: string }): void;

  protected abstract renderFrame(ctx: MatrixFrameContext): void;
}
