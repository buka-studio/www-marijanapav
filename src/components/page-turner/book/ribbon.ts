import { bindDrag, dragThreshold } from '@ui-sdk/core';
import { createVelocityTracker } from '@ui-sdk/core/gesture';

import type { Point, Ribbon, RibbonScene, Strip } from '../core';
import { development, reducedMotion, type Scene } from './scene';
import { ribbonAt, ribbonHere, type BookState } from './state';

/**
 * The ribbon's wiring: where it lies among the leaves, the button over its tail, and the pull on it. Whoever
 * renders the button makes the cloth, so a book without a ribbon carries none of it.
 */

/**
 * How near its pile a turning leaf must be to count as lying in it: the share of its turn left (`way`), and
 * its corner's distance from rest in page widths (`corner`).
 */
const FLAT = { way: 0.01, corner: 0.02 };
/** Least width of the ribbon's button, in px, however narrow the ribbon. */
const TARGET = 28;
/** How much left of a single page must show for a ribbon to lie there, in page widths: its own width, by the spine. */
const TAIL = 0.04;

interface RibbonOptions {
  scene: Scene;
  state(): BookState;
  locate(event: PointerEvent): Point;
  /** Starts drawing frames. A `quiet` start isn't a turn. */
  wake(quiet?: boolean): void;
  /** Whether a corner is lifted under the pointer: a peek, not a turn. */
  peeking(): boolean;
  onDestroy(cleanup: () => void): void;
}

function createRibbonKeeper({ scene, state, locate, wake, peeking, onDestroy }: RibbonOptions) {
  let ribbon: Ribbon | undefined;
  let el: HTMLElement | undefined;
  let shown = false;

  /**
   * The piles as they look, which is what a ribbon lies on or under: a leaf waiting to lift is still in its
   * pile, and one that is down and settling is already in the other, though the turn still moves both.
   */
  const piles = (): RibbonScene['under'] => {
    const { turns, aspect } = scene;
    if (!turns) return { left: -1, right: 0 };
    const { active } = turns;
    const lies = (index: number, side: 0 | 1) => {
      const leaf = active.find((leaf) => leaf.index === index);
      if (!leaf || leaf.held || Math.abs(leaf.t - side) > FLAT.way) return false;
      const x = side === 1 ? -1 : 1;
      const y = leaf.corner === 'bottom' ? aspect : 0;
      return Math.hypot(leaf.point.x - x, leaf.point.y - y) <= FLAT.corner;
    };
    let { left, right } = turns.under;
    while (lies(left + 1, 1)) left++;
    while (lies(right - 1, 0)) right--;
    return { left, right };
  };

  const sceneOf = (): RibbonScene => {
    const { turns } = scene;
    return {
      h: scene.aspect,
      left: state().columns === 2 || scene.verso >= TAIL,
      leafCount: turns?.leafCount ?? 0,
      under: piles(),
      turned: turns?.turned ?? 0,
      turning: (turns?.active.length ?? 0) > 0 && !peeking(),
      still: reducedMotion(),
    };
  };

  /** Lets the ribbon find its place after the book has changed under it. */
  const settle = () => {
    if (el) wake(true);
  };

  /** Reads the ribbon's colour from the stylesheet. */
  const dress = () => {
    if (el && ribbon) ribbon.strip.colour = getComputedStyle(el).color;
  };

  let stopPull: (() => void) | undefined;
  onDestroy(() => stopPull?.());

  return {
    /** The cloth to draw now, if any. */
    get strip(): Strip | undefined {
      return shown ? ribbon?.strip : undefined;
    },

    /** Moves the ribbon on to `time`. Returns whether it is still moving. */
    sway(time: number) {
      const gap = scene.turns && el && ribbon ? ribbonAt(state()) : null;
      shown = gap !== null;
      return gap !== null && ribbon!.step(time, sceneOf(), gap);
    },

    /** A ribbon that lay still starts from now, not from when it last moved. */
    rouse() {
      ribbon?.wake();
    },

    dress,

    /** Puts the ribbon's button over its tail, so a press or a pull finds it. */
    place() {
      if (!scene.el || !el || !ribbon || !shown) return;
      const columns = state().columns;
      // The width as last measured: reading it here would force layout in every frame.
      const width = scene.across / columns;
      const spine = columns === 2 ? width : 0;
      const [left, top, right, bottom] = ribbon.tail();
      // Never too small to press.
      const pad = Math.max(0, (TARGET - (right - left) * width) / 2);
      const box = [
        spine + left * width - pad,
        top * width,
        (right - left) * width + 2 * pad,
        (bottom - top) * width,
      ];
      const [x, y, w, h] = box.map((value) => `${(Math.round(value * 2) / 2).toFixed(1)}px`);
      const style = el.style;
      if (style.left !== x) style.left = x!;
      if (style.top !== y) style.top = y!;
      if (style.width !== w) style.width = w!;
      if (style.height !== h) style.height = h!;
    },

    settle,

    /** The ribbon moved. If into the pages in view, it is drawn up out of where it lay and drops down their gutter. */
    moved() {
      if (el && ribbon && ribbonHere(state()) && !reducedMotion()) ribbon.lay(performance.now());
      settle();
    },

    /** Binds the ribbon's button and what makes its cloth. The ribbon is drawn while the button is bound. */
    bind(button: HTMLElement, make: (() => Ribbon) | undefined) {
      el = button;
      ribbon ??= make?.();
      // The button is placed over the tail relative to the stage, which is the size of the pages.
      if (development() && !button.closest('[data-slot="book-stage"]')) {
        console.error(
          'page-turner: <BookRibbon> must be inside a <BookStage>, after its <BookPages>.',
        );
      }
      dress();
      settle();
      return () => {
        if (el !== button) return;
        el = undefined;
        for (const side of ['left', 'top', 'width', 'height'] as const) button.style[side] = '';
        // One more frame, to draw the book without it.
        wake(true);
      };
    },

    /**
     * Follows a drag on the ribbon's tail: it goes where pulled, as far as it reaches, and lies where left.
     * Under other pages only the tail comes, no further up than their edge: pulling it never says what the
     * ribbon marks. Escape puts it back.
     */
    tug(event: PointerEvent, button: HTMLElement | undefined) {
      const cloth = ribbon;
      if (!button || !cloth || !scene.el || event.button !== 0) return;
      const across = createVelocityTracker();
      const down = createVelocityTracker();
      const from = locate(event);
      stopPull?.();
      stopPull = bindDrag(button, event, {
        threshold: dragThreshold,
        onStart: () => {
          cloth.grab(from);
          button.setAttribute('data-pulled', '');
          wake(true);
        },
        onMove: ({ event: move }) => {
          const point = locate(move);
          cloth.pull(point);
          across.add(move.timeStamp, point.x);
          down.add(move.timeStamp, point.y);
          wake(true);
        },
        onEnd: (up, canceled) => {
          button.removeAttribute('data-pulled');
          if (!cloth.held) return;
          if (canceled) cloth.back();
          else
            cloth.release({
              x: across.velocity(up.timeStamp) * 1000,
              y: down.velocity(up.timeStamp) * 1000,
            });
          wake(true);
        },
        cancelOnEscape: true,
      });
    },
  };
}

type RibbonKeeper = ReturnType<typeof createRibbonKeeper>;

export { createRibbonKeeper };
export type { RibbonKeeper };
