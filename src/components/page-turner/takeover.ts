/**
 * Covers the moment a canvas takes the pages over. The server's HTML is pages that fold; a canvas can't draw them
 * at once (one that draws its own children has no picture until the next paint, one that draws from pictures must
 * take them first), and when it does the book looks different. So a copy of the pages as they lay stays over the
 * canvas until it has drawn, then they cross-fade: the canvas comes up round the copy, then the copy goes.
 */

/** Canvas fade-in, copy fade-out, and the copy's delay after the canvas starts, in ms. */
const ARRIVE = 200;
const LEAVE = 240;
const WAIT = 100;
/** How long the copy waits for the canvas to draw before it gives up and goes, in ms. */
const LATEST = 1500;
/** Fast at first, then settling: what suits something coming in. */
const EASE = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

/** What a copy mustn't bring with it: these load, play or run. */
const LIVELY = 'iframe, video, audio, object, embed, script';

/** Makes a copy for looking at only: aria-hidden, inert, no ids or names, nothing that loads, plays or runs. */
function quieten(copy: HTMLElement) {
  copy.setAttribute('aria-hidden', 'true');
  copy.inert = true;
  for (const el of copy.querySelectorAll(LIVELY)) {
    if (el.localName === 'script') el.remove();
    else for (const name of ['src', 'srcdoc', 'data', 'autoplay']) el.removeAttribute(name);
  }
  for (const el of [copy, ...copy.querySelectorAll('[id], [name], [for], [autofocus]')]) {
    for (const name of ['id', 'name', 'for', 'autofocus']) el.removeAttribute(name);
  }
}

interface Takeover {
  /** Lays the copy over `canvas`, to stay until the canvas has drawn. It can be moved to another. */
  cover(canvas: HTMLElement): void;
  /** Fades from the copy to the canvas, which has now drawn what the copy shows. */
  reveal(): void;
  /** Takes the copy away at once. */
  drop(): void;
  /** Whether the copy is still there. */
  readonly active: boolean;
}

/**
 * Copies what `stage` shows now: its pages and the ribbon among them, or with `"strip"` the ribbon alone, for a
 * canvas that lies over pages which stay where they are.
 */
function createTakeover(stage: HTMLElement, what: 'pages' | 'strip' = 'pages'): Takeover {
  const doc = stage.ownerDocument;
  const view = doc.defaultView;
  const ghost = doc.createElement('div');
  ghost.setAttribute('data-slot', 'book-ghost');
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;

  const box = stage.getBoundingClientRect();
  if (box.width > 0 && box.height > 0) {
    for (const child of Array.from(stage.children)) {
      if (!(child instanceof view!.HTMLElement || child instanceof view!.SVGElement)) continue;
      const slot = child.getAttribute('data-slot');
      if (slot !== 'book-strip' && (what === 'strip' || slot !== 'book-page-frame')) continue;
      const style = view!.getComputedStyle(child);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = child.getBoundingClientRect();
      const copy = child.cloneNode(true) as HTMLElement | SVGElement;
      // Its place now, set inline: the rules that put it there match the pages, not a copy.
      Object.assign(copy.style, {
        position: 'absolute',
        left: `${((rect.left - box.left) / box.width) * 100}%`,
        top: `${((rect.top - box.top) / box.height) * 100}%`,
        width: `${(rect.width / box.width) * 100}%`,
        height: `${(rect.height / box.height) * 100}%`,
        margin: '0',
        translate: 'none',
        visibility: 'visible',
        zIndex: style.zIndex,
      });
      ghost.appendChild(copy);
    }
    quieten(ghost);
  }

  let canvas: HTMLElement | undefined;
  let state: 'made' | 'covering' | 'revealing' | 'gone' = 'made';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Animation[] = [];

  function drop() {
    if (state === 'gone') return;
    state = 'gone';
    clearTimeout(timer);
    ghost.remove();
    canvas?.removeAttribute('data-arriving');
    for (const animation of running) animation.cancel();
    running = [];
  }

  return {
    cover(el) {
      if (state !== 'made' && state !== 'covering') return;
      if (state === 'made') timer = setTimeout(drop, LATEST);
      state = 'covering';
      canvas?.removeAttribute('data-arriving');
      canvas = el;
      el.setAttribute('data-arriving', '');
      stage.appendChild(ghost);
    },
    reveal() {
      if (state !== 'covering' || !canvas) return;
      const still = view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (still || typeof ghost.animate !== 'function') {
        drop();
        return;
      }
      state = 'revealing';
      clearTimeout(timer);
      const options = { easing: EASE, fill: 'both' } as const;
      // Over pages that stay where they are, the canvas and what it replaces change places in one go.
      const delay = what === 'strip' ? 0 : WAIT;
      running = [
        canvas.animate([{ opacity: 0 }, { opacity: 1 }], {
          ...options,
          duration: what === 'strip' ? LEAVE : ARRIVE,
        }),
        ghost.animate([{ opacity: 1 }, { opacity: 0 }], { ...options, duration: LEAVE, delay }),
      ];
      Promise.all(running.map((animation) => animation.finished)).then(drop, drop);
    },
    drop,
    get active() {
      return state === 'covering' || state === 'revealing';
    },
  };
}

export { createTakeover, quieten };
export type { Takeover };
