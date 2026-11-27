/** The frame loop: draws while anything moves, and reports when a turn starts and lands. */

/** What a frame leaves still moving. */
interface Moving {
  /** A turn is still under way: a leaf in the air, or in a hand. */
  turning: boolean;
  /** Anything at all still moves. A ribbon swinging on after the leaves have landed isn't a turn. */
  moving: boolean;
}

interface EngineOptions {
  /** Moves everything on to `time` and draws it. Returns what still moves, or undefined with no pages to draw. */
  step(time: number): Moving | undefined;
  /** Called before the first frame of a run. */
  rouse?(): void;
  /** Told true on every start that isn't quiet, and false after each frame that leaves no turn: the value repeats. */
  turning(is: boolean): void;
  /** Called after each frame that leaves no turn under way. */
  landed(): void;
  /** Default to `requestAnimationFrame` and `cancelAnimationFrame`; a test may bring its own. */
  request?: (frame: (time: number) => void) => number;
  cancel?: (frame: number) => void;
}

function createEngine({ step, rouse, turning, landed, request, cancel }: EngineOptions) {
  const ask = request ?? ((frame: (time: number) => void) => requestAnimationFrame(frame));
  const drop = cancel ?? ((frame: number) => cancelAnimationFrame(frame));
  /** The pending frame's id, or 0. */
  let frame = 0;

  const tick = (time: number) => {
    let left: Moving | undefined;
    try {
      left = step(time);
    } finally {
      // `frame` stays set through `step`, so a wake inside it doesn't ask for a second frame.
      // If `step` threw, it is cleared: the next turn can ask for one.
      frame = left?.moving ? ask(tick) : 0;
    }
    // No pages: nothing was drawn, and nothing has landed.
    if (!left || left.turning) return;
    turning(false);
    landed();
  };

  return {
    /** Whether a frame is pending. */
    get running() {
      return frame !== 0;
    },

    /** Starts drawing frames. A `quiet` start (a corner lifting, a ribbon moving) isn't a turn. */
    wake(quiet = false) {
      if (!quiet) turning(true);
      if (frame !== 0) return;
      rouse?.();
      frame = ask(tick);
    },

    /** Stops drawing and cancels the pending frame. */
    stop() {
      if (frame !== 0) drop(frame);
      frame = 0;
    },
  };
}

type Engine = ReturnType<typeof createEngine>;

export { createEngine };
export type { Engine, EngineOptions, Moving };
