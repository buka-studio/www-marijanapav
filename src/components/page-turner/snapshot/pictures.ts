/**
 * Pictures of pages, taken with snapdom one at a time as they are asked for, since a picture takes a moment and
 * doesn't happen by itself; the pages are watched for what would make one out of date. It can't see a pointer
 * hovering, an animation running, or a style changed on something outside the pages: those show in the next picture
 * taken for another reason, and not before.
 */

/** How snapdom is asked for a picture: `snapdom.toCanvas`. */
type Snap = (
  element: Element,
  options: { scale: number; dpr: number; backgroundColor: null },
) => Promise<HTMLCanvasElement>;

interface PictureSourceOptions {
  /** What holds the pages. It is watched for changes to them. */
  stage: HTMLElement;
  snap: Snap;
  /** Called with each picture as it is taken. */
  landed: (el: HTMLElement, picture: HTMLCanvasElement) => void;
  /** Called when a page has changed, so its picture is out of date. */
  changed: () => void;
  /** Called when pictures of these pages can't be taken after all. */
  failed: () => void;
}

/** What the book itself sets on a page as it turns, none of which shows. */
const OURS = new Set([
  'inert',
  'aria-hidden',
  'aria-label',
  'aria-roledescription',
  'data-face',
  'data-hard',
]);
/** How many pictures in a row may fail before it gives up. */
const TRIES = 3;

function createPictureSource(options: PictureSourceOptions) {
  const { stage } = options;
  const doc = stage.ownerDocument;
  const view = doc.defaultView;
  /** Counts the changes that put every picture out of date at once. */
  let age = 0;
  /** The age each page's picture was taken at. */
  const taken = new WeakMap<HTMLElement, number>();
  /** The pages that have changed since their pictures were taken. */
  const changed = new Set<HTMLElement>();
  /** The pages waiting for a picture, and the one being taken. */
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
        // What the book sets on a page of its own doesn't change how it looks.
        const page = target instanceof Element && target.matches('[data-slot="book-page"]');
        if (page && OURS.has(record.attributeName ?? '')) continue;
        // And what lies around a page isn't in its picture.
        if (target instanceof Element && !target.closest('[data-slot="book-page"]')) continue;
      }
      touch(target);
    }
  });
  watch.observe(stage, { subtree: true, childList: true, characterData: true, attributes: true });

  const onEvent = (event: Event) => touch(event.target as Node | null);
  // None of these changes the document, but each changes what a page shows.
  const events = ['input', 'change', 'focusin', 'focusout', 'toggle'] as const;
  for (const name of events) stage.addEventListener(name, onEvent, { passive: true });
  // An image's `load` doesn't bubble.
  stage.addEventListener('load', onEvent, { capture: true, passive: true });

  doc.fonts?.addEventListener?.('loadingdone', all);
  const scheme = view?.matchMedia?.('(prefers-color-scheme: dark)');
  scheme?.addEventListener?.('change', all);

  /** Takes the pictures that are waiting, one after another, a frame apart. */
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
    // Whatever changes from here on is a reason for another.
    changed.delete(el);
    taken.set(el, age);
    options
      .snap(el, { scale, dpr: 1, backgroundColor: null })
      .then(
        (picture) => {
          failures = 0;
          if (!done && el.isConnected) options.landed(el, picture);
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
    /** Whether a page has no picture yet, or has changed since its picture was taken. */
    stale(el: HTMLElement) {
      return taken.get(el) !== age || changed.has(el);
    },
    /** Asks for a picture of a page, `scale` pixels to each CSS px. It lands when it is taken. */
    want(el: HTMLElement, scale: number) {
      if (done || failures >= TRIES) return;
      waiting.set(el, scale);
      next();
    },
    coming(el: HTMLElement) {
      return taking === el || waiting.has(el);
    },
    /** Gives up waiting for pictures of any pages but these. One being taken is finished. */
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
