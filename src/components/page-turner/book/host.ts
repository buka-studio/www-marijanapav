import { facesOf } from '../core';
import { createRenderer, type PageElements } from '../dom';
import type { BookDrawer, BookRenderer } from '../renderer';
import { createTakeover, type Takeover } from '../takeover';
import type { Scene } from './scene';
import type { BookState } from './state';

/** What draws the pages: folding, or a renderer's canvas, covered by a copy of the folding pages until it has drawn. */

interface HostOptions {
  scene: Scene;
  state(): BookState;
  hard(leaf: number): boolean;
  /** Redraws the book with whatever draws it now. */
  refresh(): void;
  /** Draws the pages as they lie now, ribbon included, so a copy can be made of them. */
  still(): void;
  /** Reports that a renderer couldn't draw this book, so its canvas goes and the pages fold. */
  letDown(renderer: BookRenderer): void;
}

const SPARES = '[data-slot="book-page-frame"][data-blank] [data-slot="book-page"]';

function createHost({ scene, state, hard, refresh, still, letDown }: HostOptions) {
  let drawer: BookDrawer | undefined;
  /** The canvas drawing the pages, if any, and its renderer. */
  let canvas: { el: HTMLCanvasElement; renderer: BookRenderer } | undefined;
  /** A copy of the folding pages, kept for a canvas about to take them over. */
  let kept: Takeover | undefined;
  /** The copy covering the pages while a canvas takes them over. */
  let takeover: Takeover | undefined;
  /** Renderers that couldn't draw this book. None is tried twice, however often its canvas is rebound. */
  const spent = new Set<BookRenderer>();

  /** Reports a renderer that can't draw this book, once. */
  const fail = (renderer: BookRenderer) => {
    if (spent.has(renderer)) return;
    spent.add(renderer);
    letDown(renderer);
  };

  const faces = (leaf: number) => facesOf(leaf, state().columns, state().pageCount ?? 0);
  const board = (index: number) => scene.papers.get(index)?.hasAttribute('data-hard') === true;

  /** Makes the drawer for the pages where they are now: in a canvas, under one, or on their own. */
  const mount = () => {
    drawer?.clear();
    drawer = undefined;
    const pages = scene.el;
    if (!pages) return;
    if (canvas && spent.has(canvas.renderer)) {
      // Already failed on this book; its canvas is on its way out.
    } else if (canvas) {
      const { el, renderer } = canvas;
      // Spare pages sit with the others: inside an "around" canvas, or in the pages' element under an "over" one.
      const among = renderer.canvas === 'around' ? el : pages;
      try {
        drawer = renderer.create({
          canvas: el,
          pages,
          page: (index) => scene.papers.get(index),
          faces,
          hard,
          board,
          columns: () => state().columns,
          blanks: () => Array.from(among.querySelectorAll<HTMLElement>(`:scope > ${SPARES}`)),
          drawn: () => takeover?.reveal(),
          // A later failure, such as a lost context. Ignored unless this canvas is still the one drawing.
          failed: () => {
            if (canvas?.el === el) fail(renderer);
          },
        });
      } catch (error) {
        // A shader the browser won't compile, say: logged, and the pages fold.
        console.error(
          `page-turner: the ${renderer.name} renderer couldn't start, so the pages fold.`,
          error,
        );
      }
      if (!drawer) fail(renderer);
    } else {
      drawer = createRenderer({
        page: (index) => elementsOf(scene.papers.get(index)),
        faces,
        columns: () => state().columns,
        verso: () => scene.verso,
        hard,
        blanks: () =>
          Array.from(pages.querySelectorAll<HTMLElement>(`:scope > ${SPARES}`), (paper) =>
            elementsOf(paper)!,
          ),
        strip: () =>
          pages.querySelector<SVGSVGElement>(':scope > [data-slot="book-strip"]') ?? undefined,
      });
    }
    // No drawer: there is no first draw for the cover to wait for.
    if (!drawer) takeover?.drop();
    refresh();
  };

  /** Covers a newly bound canvas with `copy` until the canvas has drawn. */
  const arrive = (el: HTMLElement, copy: Takeover | undefined) => {
    if (takeover !== copy) takeover?.drop();
    takeover = copy;
    copy?.cover(el);
  };

  /** A canvas lying over the pages hides only the ribbon drawn among them, so only that is copied. */
  const coverStrip = () => {
    if (scene.el && canvas?.renderer.canvas === 'over')
      arrive(canvas.el, createTakeover(scene.el, 'strip'));
  };

  return {
    get drawer() {
      return drawer;
    },

    /** Whether the pages fold, with no canvas drawing them. */
    get folding() {
      return canvas === undefined;
    },

    mount,

    /**
     * The pages were replaced by others in the same places. The folding drawer caches what it read off the
     * old ones, so it is remade; a canvas looks each page up as it draws.
     */
    forget() {
      if (!canvas) mount();
    },

    /** A leaf in the air is the canvas's to show: drops any cover still over it. */
    uncover() {
      if (takeover?.active) takeover.drop();
    },

    /** Copies the folding pages as they lie now, to cover a canvas about to take them over until it has drawn. */
    keep() {
      kept = undefined;
      if (!scene.el || canvas) return;
      // As they are now, not as the last frame left them.
      still();
      kept = createTakeover(scene.el);
    },

    /** Pages mounted; a canvas may already be bound. */
    arrived() {
      coverStrip();
      mount();
    },

    /** Pages unmounted: everything that drew them goes too. */
    left() {
      drawer?.clear();
      takeover?.drop();
      drawer = kept = takeover = undefined;
    },

    bindCanvas(el: HTMLElement, renderer: BookRenderer | undefined) {
      if (!renderer) return;
      canvas = { el: el as HTMLCanvasElement, renderer };
      if (renderer.canvas === 'around') {
        // The copy kept for it, or the cover still up if the canvas has only been rebound.
        arrive(el, kept ?? (takeover?.active ? takeover : undefined));
        kept = undefined;
      } else {
        coverStrip();
      }
      mount();
      return () => {
        if (canvas?.el !== el) return;
        canvas = undefined;
        mount();
        // React in development unbinds and rebinds at once: only drop the cover if no canvas came back.
        queueMicrotask(() => {
          if (!canvas) takeover?.drop();
        });
      };
    },
  };
}

const folding = new WeakMap<HTMLElement, PageElements>();

/** The elements around a page that fold it, if it was rendered to fold. */
function elementsOf(content: HTMLElement | undefined): PageElements | undefined {
  if (!content) return undefined;
  const known = folding.get(content);
  if (known) return known;
  const clip = content.parentElement;
  const slot = clip?.parentElement;
  // A page in a canvas has no clip box to cut it along a crease.
  if (!clip || !slot || clip.getAttribute('data-slot') !== 'book-page-clip') return undefined;
  const elements = {
    slot,
    clip,
    content,
    shade: content.querySelector<HTMLElement>(':scope > [data-slot="book-page-shade"]')!,
    cast: clip.querySelector<HTMLElement>(':scope > [data-slot="book-page-cast"]')!,
    shadow: clip.querySelector<HTMLElement>('[data-slot="book-page-shadow"]')!,
  };
  folding.set(content, elements);
  return elements;
}

type Host = ReturnType<typeof createHost>;

export { createHost };
export type { Host };
