import { leafCount, sideOf, turnedFor, type Side } from '../core';
import { reducedMotion } from './scene';
import type { BookState } from './state';

/**
 * A spread too wide for the room it has lies in a box that scrolls across it: `[data-slot="book-scroller"]`, an
 * element around the book. One page is in view at a time, with a sliver of the other, and the box snaps to either.
 * A swipe brings the other page into view; one that goes on the same way from there turns the leaf.
 *
 * Scrolling is the browser's own. All that is done here is to say when a swipe has nowhere left to scroll to, and
 * to keep a shut book's one cover in view.
 */

/** How near an end the box counts as scrolled to it, in px. */
const NEAR = 2;

interface ScrollerOptions {
  state(): BookState;
}

function createScroller({ state }: ScrollerOptions) {
  let el: HTMLElement | null = null;

  /** How far the box can scroll, in px. */
  const room = () => (el ? el.scrollWidth - el.clientWidth : 0);

  /** Whether the open book has a page on `side`. A shut one has a cover on one side and nothing on the other. */
  const has = (side: Side) => {
    const { page, pageCount, columns } = state();
    const turned = turnedFor(page, columns);
    return side === 'left' ? turned > 0 : turned < leafCount(pageCount ?? 0, columns);
  };

  /** Whether the spread is too wide for the box, so that it scrolls. */
  const active = () => el !== null && state().columns === 2 && room() > NEAR;

  /** Whether the box has further to scroll toward the page on `side`. */
  const reaches = (side: Side) => {
    if (!el || !active() || !has(side)) return false;
    return side === 'left' ? el.scrollLeft > NEAR : el.scrollLeft < room() - NEAR;
  };

  /** Brings the page on `side` into view. */
  const show = (side: Side, instant = false) => {
    if (!el || !active()) return;
    const left = side === 'left' ? 0 : room();
    if (Math.abs(el.scrollLeft - left) < 1) return;
    el.scrollTo({ left, behavior: instant || reducedMotion() ? 'instant' : 'smooth' });
  };

  /** Says whether the box scrolls and how the book lies in it, and keeps a shut book's cover in view. */
  const settle = (instant = false) => {
    if (!el) return;
    const shut = !has('left') ? 'front' : !has('right') ? 'back' : undefined;
    el.toggleAttribute('data-scrolls', active());
    if (shut) el.setAttribute('data-shut', shut);
    else el.removeAttribute('data-shut');
    if (shut) show(shut === 'front' ? 'right' : 'left', instant);
  };

  return {
    get el() {
      return el;
    },
    get active() {
      return active();
    },
    reaches,
    show,
    settle,

    /** Finds the box around `pages`, if there is one, and puts the page the book is open at in view. */
    bind(pages: HTMLElement) {
      el = pages.closest<HTMLElement>('[data-slot="book-scroller"]');
      if (!el) return undefined;
      const scroller = el;
      // The box scrolls or not as it and the book are resized.
      const resize = new ResizeObserver(() => settle(true));
      resize.observe(scroller);
      settle(true);
      const { page, columns } = state();
      const side = sideOf(page - 1, page, columns);
      if (side && has('left') && has('right')) show(side, true);
      return () => {
        resize.disconnect();
        scroller.removeAttribute('data-scrolls');
        scroller.removeAttribute('data-shut');
        el = null;
      };
    },
  };
}

type Scroller = ReturnType<typeof createScroller>;

export { createScroller };
export type { Scroller };
