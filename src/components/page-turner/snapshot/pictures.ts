type Snap = (
  element: Element,
  options: { scale: number; dpr: number; backgroundColor: null },
) => Promise<HTMLCanvasElement>;

interface PictureSourceOptions {
  stage: HTMLElement;
  snap: Snap;
  landed: (el: HTMLElement, picture: HTMLCanvasElement) => void;
  changed: () => void;
  failed: () => void;
}

const OURS = new Set([
  'inert',
  'aria-hidden',
  'aria-label',
  'aria-roledescription',
  'data-face',
  'data-hard',
  'data-sewn',
]);
const TRIES = 3;

function createPictureSource(options: PictureSourceOptions) {
  const { stage } = options;
  const doc = stage.ownerDocument;
  const view = doc.defaultView;
  let age = 0;
  const taken = new WeakMap<HTMLElement, number>();
  const changed = new Set<HTMLElement>();
  const waiting = new Map<HTMLElement, number>();
  let taking: HTMLElement | undefined;
  let failures = 0;
  let done = false;

  const pageOf = (node: Node | null) =>
    (node instanceof Element ? node : node?.parentElement)?.closest<HTMLElement>(
      '[data-slot="book-page"]',
    ) ?? undefined;

  const touch = (node: Node | null) => {
    const el = pageOf(node);
    if (!el || !stage.contains(el) || changed.has(el)) return;
    changed.add(el);
    options.changed();
  };

  const all = () => {
    age++;
    options.changed();
  };

  const watch = new MutationObserver((records) => {
    for (const record of records) {
      const target = record.target;
      if (record.type === 'attributes') {
        const page = target instanceof Element && target.matches('[data-slot="book-page"]');
        if (page && OURS.has(record.attributeName ?? '')) continue;
        if (target instanceof Element && !target.closest('[data-slot="book-page"]')) continue;
      }
      touch(target);
    }
  });
  watch.observe(stage, { subtree: true, childList: true, characterData: true, attributes: true });

  const onEvent = (event: Event) => touch(event.target as Node | null);
  const events = ['input', 'change', 'focusin', 'focusout', 'toggle'] as const;
  for (const name of events) stage.addEventListener(name, onEvent, { passive: true });
  stage.addEventListener('load', onEvent, { capture: true, passive: true });

  doc.fonts?.addEventListener?.('loadingdone', all);
  const scheme = view?.matchMedia?.('(prefers-color-scheme: dark)');
  scheme?.addEventListener?.('change', all);

  function next() {
    if (done || taking) return;
    const [el, scale] = waiting.entries().next().value ?? [];
    if (!el || scale === undefined) return;
    waiting.delete(el);
    if (!el.isConnected) {
      next();
      return;
    }
    taking = el;
    changed.delete(el);
    taken.set(el, age);
    options
      .snap(el, { scale, dpr: 1, backgroundColor: null })
      .then(
        (picture) => {
          failures = 0;
          if (!done && el.isConnected) options.landed(el, picture);
          // safari holds a canvas's pixels until it is collected
          picture.width = picture.height = 0;
        },
        () => {
          taken.delete(el);
          if (++failures >= TRIES && !done) options.failed();
        },
      )
      .finally(() => {
        taking = undefined;
        if (done) return;
        if (view) view.requestAnimationFrame(next);
        else next();
      });
  }

  return {
    stale(el: HTMLElement) {
      return taken.get(el) !== age || changed.has(el);
    },
    want(el: HTMLElement, scale: number) {
      if (done || failures >= TRIES) return;
      waiting.set(el, scale);
      next();
    },
    coming(el: HTMLElement) {
      return taking === el || waiting.has(el);
    },
    keep(els: ReadonlySet<HTMLElement>) {
      for (const el of waiting.keys()) if (!els.has(el)) waiting.delete(el);
    },
    clear() {
      done = true;
      watch.disconnect();
      for (const name of events) stage.removeEventListener(name, onEvent);
      stage.removeEventListener('load', onEvent, { capture: true });
      doc.fonts?.removeEventListener?.('loadingdone', all);
      scheme?.removeEventListener?.('change', all);
      waiting.clear();
      changed.clear();
    },
  };
}

type PictureSource = ReturnType<typeof createPictureSource>;

export { createPictureSource };
export type { PictureSource, PictureSourceOptions, Snap };
