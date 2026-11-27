import type { ChangeDetails, PrimitiveOptions } from '@ui-sdk/core';

import { leafCount, turnedFor, turnLimit, type Columns, type TurnBack } from '../core';
import type { BookRenderer } from '../renderer';

/** Why the page changed, in ui-sdk's words: `input-change` is the scrubber, `item-press` a thumbnail or the ribbon. */
type BookReason =
  | 'next-press'
  | 'previous-press'
  | 'step-key'
  | 'drag'
  | 'input-change'
  | 'item-press'
  | 'imperative';
type BookmarkReason = 'press' | 'imperative';
type BookLayout = 'auto' | 'spread' | 'single';

/** Where a page change came from, and how it is to show. */
type StepDetails = {
  reason?: BookReason;
  event?: Event;
  /**
   * Shows the page at once, with no leaf seen to turn: for a book nobody is looking at, or one put back
   * where it was. A change the app holds with `page` comes later, and turns.
   */
  instant?: boolean;
};
type MarkDetails = { reason?: BookmarkReason; event?: Event };

/** The book's own words. Give any of them to reword or translate it. */
type BookLabels = {
  /** What a screen reader calls the book, after its name. */
  book: string;
  /** Name of the button that turns back, when it has no content of its own. */
  previous: string;
  /** Name of the button that turns on, when it has no content of its own. */
  next: string;
  /** What a screen reader calls each page. */
  page: string;
  /** A page's name, like "Page 3". `page` counts from 1. */
  pageName: (page: number) => string;
  /** Which pages are in view, like "Pages 2–3 of 12": for the indicator, the scrubber and announcements. */
  pages: (pages: number[], pageCount: number | null) => string;
  /** A thumbnail's name, like "Go to page 3". */
  goToPage: (page: number) => string;
  /** The ribbon's name. `place` is where it lies, in the words of `pages`, or undefined when nowhere. */
  ribbon: (place: string | undefined) => string;
  /** Read out when the ribbon is moved to `place`. */
  ribbonMoved: (place: string) => string;
  /** Name of the button that moves the ribbon, when it holds only its icon. */
  mark: string;
};

type BookOptions = PrimitiveOptions & {
  /** The first page in view, counted from 1. Pass it with `onPageChange` to control it. */
  page?: number;
  /** The page to start on. Default 1. */
  defaultPage?: number;
  onPageChange?: (page: number, details: ChangeDetails<BookReason>) => void;
  /** Runs once the last leaf has landed. */
  onPageChangeComplete?: (page: number) => void;
  /** How many pages there are, for the server's HTML. Once mounted, the book counts its pages itself. */
  pageCount?: number;
  /** `spread` shows two pages, `single` one, `auto` a spread where the stylesheet finds room. Default `auto`. */
  layout?: BookLayout;
  /** Whether pages can be dragged. Default true. */
  drag?: boolean;
  /**
   * The most leaves in the air at once, from 2 to 12. Default 12. A longer jump turns the first and last
   * of them, and the rest change sides unseen behind those.
   */
  maxLeaves?: number;
  /**
   * How a page turns back. `mirror` lifts it by its outer left corner, the mirror image of turning forward;
   * `reverse` plays the forward turn backward. Default `mirror`.
   */
  turnBack?: TurnBack;
  /**
   * What draws the pages where the browser can, in place of folding them: `curl` from `page-turner/curl`,
   * which bends them, or `snapshot` from `page-turner/snapshot`. Elsewhere, and in the server's HTML, they fold.
   */
  renderer?: BookRenderer;
  /** What draws the pages where the browser can't do what `renderer` asks, in place of folding them. */
  fallback?: BookRenderer;
  /** Overrides for any of the book's words. */
  labels?: Partial<BookLabels>;
  /**
   * The page the ribbon marks, counted from 1, for a book with a `BookRibbon`. With none, the ribbon lies
   * inside the back cover. Pass it with `onBookmarkChange` to control it.
   */
  bookmark?: number | null;
  /** The page the ribbon marks to start with. */
  defaultBookmark?: number | null;
  onBookmarkChange?: (page: number, details: ChangeDetails<BookmarkReason>) => void;
  controller?: BookController;
};

type BookState = {
  page: number;
  pageCount: number | null;
  layout: BookLayout;
  columns: Columns;
  drag: boolean;
  renderer: BookRenderer | undefined;
  fallback: BookRenderer | undefined;
  /** Kept in state so the parts that say them follow a change. */
  labels: BookLabels;
  bookmark: number | null;
  turning: boolean;
  dragging: boolean;
};

// What each part tells a render function or a `children` function about itself.

type BookRootState = { page: number; pages: number[]; pageCount: number | null; columns: Columns };
type BookPagesState = {
  columns: Columns;
  /** The renderer asked for, whether or not the browser can do it. */
  renderer: BookRenderer | undefined;
  /** What to draw with when the browser can't. */
  fallback: BookRenderer | undefined;
};
type BookPageState = {
  /** Its place in the book, counted from 0. */
  index: number;
  /** The side it rests on, when it is in view. */
  side: 'left' | 'right' | undefined;
  /** Whether it is the first page in view. */
  current: boolean;
  hard: boolean;
  /** Whether the ribbon can be laid in the pages it shows with. */
  markable: boolean;
};
type BookStepState = {
  disabled: boolean;
  /** The book's label for the button, like "Next page": for one that holds only an icon. */
  label: string;
};
type BookIndicatorState = {
  page: number;
  pages: number[];
  pageCount: number | null;
  label: string;
};
type BookScrubberState = {
  /** How many leaves are turned. */
  value: number;
  /** How many can be. */
  max: number;
};
type BookThumbnailState = { page: number; current: boolean };
type BookRibbonState = {
  /** The first of the pages the ribbon marks, counted from 1. */
  page: number | null;
  /** Whether those pages are the ones in view. */
  here: boolean;
};
type BookRibbonMarkState = {
  /** Whether the ribbon marks the pages in view. */
  marked: boolean;
};

/** Turns a book's pages and moves its ribbon. Each returns whether anything changed. */
type BookActions = {
  /** Shows `page`, counted from 1. */
  setPage: (page: number, details?: StepDetails) => boolean;
  next: (details?: StepDetails) => boolean;
  previous: (details?: StepDetails) => boolean;
  first: (details?: StepDetails) => boolean;
  last: (details?: StepDetails) => boolean;
  /** Moves the ribbon to mark `page`, counted from 1. */
  setBookmark: (page: number, details?: MarkDetails) => boolean;
  /** Opens the book where the ribbon lies. */
  goToBookmark: (details?: StepDetails) => boolean;
};

/**
 * A book, to code outside it: the means to turn it, and where it is open. Before the book mounts and
 * after it unmounts, the actions do nothing and the getters return undefined.
 */
type BookController = BookActions & {
  /** The first page in view, counted from 1. */
  getPage: () => number;
  /** Every page in view. The same array while they are the same pages. */
  getPages: () => number[];
  getPageCount: () => number | null;
  /** How many pages show side by side. */
  getColumns: () => Columns;
  /** The page the ribbon marks, or null when it marks none. */
  getBookmark: () => number | null;
  canGoPrevious: () => boolean;
  canGoNext: () => boolean;
  /**
   * Calls `listener` when any of those answers changes, and when the controller gets or loses a book; not
   * while leaves are in the air. Can be called before there is a book. Returns a function that stops it.
   */
  subscribe: (listener: () => void) => () => void;
};

function pagesLabel(pages: number[], pageCount: number | null) {
  const range = pages.length > 1 ? `Pages ${pages[0]}–${pages.at(-1)}` : `Page ${pages[0] ?? 1}`;
  return pageCount === null ? range : `${range} of ${pageCount}`;
}

const LABELS: BookLabels = {
  book: 'book',
  previous: 'Previous page',
  next: 'Next page',
  page: 'page',
  pageName: (page) => `Page ${page}`,
  pages: pagesLabel,
  goToPage: (page) => `Go to page ${page}`,
  ribbon: (place) => (place === undefined ? 'Open at the ribbon' : `Open at the ribbon: ${place}`),
  ribbonMoved: (place) => `Ribbon: ${place}`,
  mark: 'Mark this page',
};

/** Labels cached per set given, so the same set gives the same object and nothing sees a change that isn't one. */
const worded = new WeakMap<object, BookLabels>();

function labelsOf(options: BookOptions): BookLabels {
  const given = options.labels;
  if (!given) return LABELS;
  let labels = worded.get(given);
  if (!labels) {
    labels = { ...LABELS };
    // An undefined word keeps the default.
    for (const [name, word] of Object.entries(given)) {
      if (word !== undefined) (labels as Record<string, unknown>)[name] = word;
    }
    worded.set(given, labels);
  }
  return labels;
}

/** `page` as a whole page the book has: an address may ask for any number. With no count yet, only 1 is a bound. */
function within(page: number, count: number | null) {
  const asked = Number.isNaN(page) ? 1 : Math.max(1, Math.floor(page));
  return count === null ? asked : Math.min(asked, Math.max(1, count));
}

/** The pages that show when `turned` leaves lie on the left, counted from 1. */
function pagesAt(turned: number, state: BookState): number[] {
  const count = state.pageCount ?? Infinity;
  if (state.columns === 1) return [turned + 1];
  return [turned * 2, turned * 2 + 1].filter((page) => page >= 1 && page <= count);
}

/** The pages in view, counted from 1. */
function pagesInView(state: BookState): number[] {
  return pagesAt(turnedFor(state.page, state.columns), state);
}

/** Which pages show when `turned` leaves lie on the left, in words. */
function placeAt(turned: number, state: BookState) {
  return state.labels.pages(pagesAt(turned, state), state.pageCount);
}

/** Which pages are in view, in words. */
function describe(state: BookState) {
  return state.labels.pages(pagesInView(state), state.pageCount);
}

/** Which cover a closed book shows: its front, or its back when every leaf is turned. */
function closedOf(state: BookState): 'front' | 'back' | undefined {
  const turned = turnedFor(state.page, state.columns);
  if (turned === 0) return 'front';
  if (state.pageCount === null) return undefined;
  // In one column the last page never turns away, so the book is shut when it shows.
  const all = state.columns === 2 ? leafCount(state.pageCount, 2) : turnLimit(state.pageCount, 1);
  return turned === all ? 'back' : undefined;
}

/**
 * How many leaves lie before the pages the ribbon marks. It lies between two leaves, never outside a cover,
 * and inside the back one when it marks nothing. Null with fewer than 2 leaves, or none counted yet.
 */
function ribbonAt(state: BookState): number | null {
  if (state.pageCount === null) return null;
  const leaves = leafCount(state.pageCount, state.columns);
  if (leaves < 2) return null;
  const turned =
    state.bookmark === null
      ? leaves - 1
      : turnedFor(Math.max(1, Math.floor(state.bookmark)), state.columns);
  return Math.min(leaves - 1, Math.max(1, turned));
}

/** Whether the ribbon marks the pages in view. */
function ribbonHere(state: BookState) {
  return ribbonAt(state) === turnedFor(state.page, state.columns);
}

function canTurn(state: BookState, by: number) {
  const turned = turnedFor(state.page, state.columns) + by;
  const limit = state.pageCount === null ? Infinity : turnLimit(state.pageCount, state.columns);
  return turned >= 0 && turned <= limit;
}

/** How many leaves can be turned, or 0 until the page count is known. */
function stops(state: BookState) {
  return state.pageCount === null ? 0 : turnLimit(state.pageCount, state.columns);
}

export {
  canTurn,
  closedOf,
  describe,
  labelsOf,
  pagesAt,
  pagesInView,
  pagesLabel,
  placeAt,
  ribbonAt,
  ribbonHere,
  stops,
  within,
};
export type {
  BookActions,
  BookController,
  BookIndicatorState,
  BookLabels,
  BookLayout,
  BookmarkReason,
  BookOptions,
  BookPageState,
  BookPagesState,
  BookReason,
  BookRibbonMarkState,
  BookRibbonState,
  BookRootState,
  BookScrubberState,
  BookState,
  BookStepState,
  BookThumbnailState,
  MarkDetails,
  StepDetails,
};
