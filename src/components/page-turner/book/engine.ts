interface Moving {
  turning: boolean;
  moving: boolean;
}

interface EngineOptions {
  step(time: number): Moving | undefined;
  rouse?(): void;
  turning(is: boolean): void;
  landed(): void;
  request?: (frame: (time: number) => void) => number;
  cancel?: (frame: number) => void;
}

function createEngine({ step, rouse, turning, landed, request, cancel }: EngineOptions) {
  const ask = request ?? ((frame: (time: number) => void) => requestAnimationFrame(frame));
  const drop = cancel ?? ((frame: number) => cancelAnimationFrame(frame));
  let frame = 0;

  const tick = (time: number) => {
    let left: Moving | undefined;
    try {
      left = step(time);
    } finally {
      frame = left?.moving ? ask(tick) : 0;
    }
    if (!left || left.turning) return;
    turning(false);
    landed();
  };

  return {
    get running() {
      return frame !== 0;
    },

    wake(quiet = false) {
      if (!quiet) turning(true);
      if (frame !== 0) return;
      rouse?.();
      frame = ask(tick);
    },

    stop() {
      if (frame !== 0) drop(frame);
      frame = 0;
    },
  };
}

type Engine = ReturnType<typeof createEngine>;

export { createEngine };
export type { Engine, EngineOptions, Moving };
