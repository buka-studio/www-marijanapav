import { leafCount, sideOf, turnedFor, type Side } from '../core';
import { reducedMotion } from './scene';
import type { BookState } from './state';

const NEAR = 2;

interface ScrollerOptions {
  state(): BookState;
}

function createScroller({ state }: ScrollerOptions) {
  let el: HTMLElement | null = null;

  const room = () => (el ? el.scrollWidth - el.clientWidth : 0);

  const has = (side: Side) => {
    const { page, pageCount, columns } = state();
    const turned = turnedFor(page, columns);
    return side === 'left' ? turned > 0 : turned < leafCount(pageCount ?? 0, columns);
  };

  const active = () => el !== null && state().columns === 2 && room() > NEAR;

  const reaches = (side: Side) => {
    if (!el || !active() || !has(side)) return false;
    return side === 'left' ? el.scrollLeft > NEAR : el.scrollLeft < room() - NEAR;
  };

  const show = (side: Side, instant = false) => {
    if (!el || !active()) return;
    const left = side === 'left' ? 0 : room();
    if (Math.abs(el.scrollLeft - left) < 1) return;
    el.scrollTo({ left, behavior: instant || reducedMotion() ? 'instant' : 'smooth' });
  };

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

    bind(pages: HTMLElement) {
      el = pages.closest<HTMLElement>('[data-slot="book-scroller"]');
      if (!el) return undefined;
      const scroller = el;
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
