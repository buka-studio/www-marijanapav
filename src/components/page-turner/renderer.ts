import type { Columns, Strip, Turns } from './core';

/**
 * What draws a book's pages. Every book can fold its pages with elements and styles alone, which is what the
 * server's HTML shows. A renderer draws them in a canvas instead, where the browser can: `curl` from
 * `page-turner/curl`, or `snapshot` from `page-turner/snapshot`. A book loads only the ones it is given.
 */
interface BookRenderer {
  /** Its name. The canvas says which is drawing: `data-renderer`. */
  readonly name: string;
  /**
   * Where its canvas goes: `around` the pages, which are its children and which it draws from inside itself; or
   * `over` pages that stay as they are for folding, and are drawn from pictures of them.
   */
  readonly canvas: 'around' | 'over';
  /** Whether this browser can do it. False on a server. */
  can(): boolean;
  /** Whether it is here to use: the browser can, and what it needs has been fetched. */
  ready(): boolean;
  /** Fetches what it needs, if it needs anything. */
  load(): void;
  /** Calls `listener` when what `can` or `ready` says changes. */
  watch(listener: () => void): () => void;
  /**
   * Makes what draws on `host.canvas`. If it can't, it returns nothing or throws: either way that one book's pages
   * fold, and what was thrown is logged.
   */
  create(host: BookRendererHost): BookDrawer | undefined;
}

/** Draws the leaves as they are now, and the ribbon among them. */
interface BookDrawer {
  /** `h` is page height over page width. */
  draw(turns: Turns, h: number, ribbon?: Strip): void;
  /** Puts everything it has touched back as it found it. */
  clear(): void;
}

/** What a renderer is given to draw a book with. */
interface BookRendererHost {
  canvas: HTMLCanvasElement;
  /** The element the pages sit and turn in. */
  pages: HTMLElement;
  /** The paper of page `index`, or undefined when it isn't mounted. */
  page(index: number): HTMLElement | undefined;
  /** Which pages are on a leaf's two sides. -1 for a blank side. */
  faces(leaf: number): { front: number; back: number };
  /** Whether a leaf is stiff, like a cover. */
  hard(leaf: number): boolean;
  /** Whether page `index` is the outside of a board. */
  board(index: number): boolean;
  columns(): Columns;
  /** Spare pages with nothing on them, to stand in for blank sides. */
  blanks(): HTMLElement[];
  /** To be called once the canvas shows the pages. */
  drawn(): void;
  /**
   * To be called if it can't go on drawing, as when the browser takes its WebGL context away. This book's pages
   * fold from then on, or the `fallback` draws them if it can; other books aren't touched.
   */
  failed(): void;
}

/**
 * The renderer this browser should draw a book with, here yet or not: the one asked for, or the fallback where it
 * can't. `letDown` are the ones that have already failed to draw this book.
 */
function wantedRenderer(
  renderer: BookRenderer | undefined,
  fallback: BookRenderer | undefined,
  letDown: readonly BookRenderer[] = [],
) {
  if (!renderer) return undefined;
  const can = (one: BookRenderer | undefined) =>
    one !== undefined && !letDown.includes(one) && one.can();
  if (can(renderer)) return renderer;
  return can(fallback) ? fallback : undefined;
}

/** The renderer to draw with now. Until one is here to use, the pages fold. */
function readyRenderer(
  renderer: BookRenderer | undefined,
  fallback: BookRenderer | undefined,
  letDown: readonly BookRenderer[] = [],
) {
  const wanted = wantedRenderer(renderer, fallback, letDown);
  return wanted?.ready() ? wanted : undefined;
}

export { readyRenderer, wantedRenderer };
export type { BookDrawer, BookRenderer, BookRendererHost };
