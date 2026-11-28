const ARRIVE = 200;
const LEAVE = 240;
const WAIT = 100;
const LATEST = 1500;
const EASE = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

const LIVELY = 'iframe, video, audio, object, embed, script';

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
  cover(canvas: HTMLElement): void;
  reveal(): void;
  drop(): void;
  readonly active: boolean;
}

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
