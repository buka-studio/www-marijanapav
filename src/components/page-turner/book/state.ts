import type { ChangeDetails, PrimitiveOptions } from '@ui-sdk/core';

import { leafCount, turnedFor, turnLimit, type Columns, type TurnBack } from '../core';
import type { BookRenderer } from '../renderer';

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

type StepDetails = {
  reason?: BookReason;
  event?: Event;
  instant?: boolean;
};
type MarkDetails = { reason?: BookmarkReason; event?: Event };

type BookLabels = {
  book: string;
  previous: string;
  next: string;
  page: string;
  pageName: (page: number) => string;
  pages: (pages: number[], pageCount: number | null) => string;
  goToPage: (page: number) => string;
  ribbon: (place: string | undefined) => string;
  ribbonMoved: (place: string) => string;
  mark: string;
};

type BookOptions = PrimitiveOptions & {
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number, details: ChangeDetails<BookReason>) => void;
  onPageChangeComplete?: (page: number) => void;
  pageCount?: number;
  layout?: BookLayout;
  drag?: boolean;
  maxLeaves?: number;
  turnBack?: TurnBack;
  renderer?: BookRenderer;
  fallback?: BookRenderer;
  labels?: Partial<BookLabels>;
  bookmark?: number | null;
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
  labels: BookLabels;
  bookmark: number | null;
  turning: boolean;
  dragging: boolean;
};

type BookRootState = { page: number; pages: number[]; pageCount: number | null; columns: Columns };
type BookPagesState = {
  columns: Columns;
  renderer: BookRenderer | undefined;
  fallback: BookRenderer | undefined;
};
type BookPageState = {
  index: number;
  side: 'left' | 'right' | undefined;
  current: boolean;
  hard: boolean;
  markable: boolean;
};
type BookStepState = {
  disabled: boolean;
  label: string;
};
type BookIndicatorState = {
  page: number;
  pages: number[];
  pageCount: number | null;
  label: string;
};
type BookScrubberState = {
  value: number;
  max: number;
};
type BookThumbnailState = { page: number; current: boolean };
type BookRibbonState = {
  page: number | null;
  here: boolean;
};
type BookRibbonMarkState = {
  marked: boolean;
};

type BookActions = {
  setPage: (page: number, details?: StepDetails) => boolean;
  next: (details?: StepDetails) => boolean;
  previous: (details?: StepDetails) => boolean;
  first: (details?: StepDetails) => boolean;
  last: (details?: StepDetails) => boolean;
  setBookmark: (page: number, details?: MarkDetails) => boolean;
  goToBookmark: (details?: StepDetails) => boolean;
};

type BookController = BookActions & {
  getPage: () => number;
  getPages: () => number[];
  getPageCount: () => number | null;
  getColumns: () => Columns;
  getBookmark: () => number | null;
  canGoPrevious: () => boolean;
  canGoNext: () => boolean;
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

const worded = new WeakMap<object, BookLabels>();

function labelsOf(options: BookOptions): BookLabels {
  const given = options.labels;
  if (!given) return LABELS;
  let labels = worded.get(given);
  if (!labels) {
    labels = { ...LABELS };
    for (const [name, word] of Object.entries(given)) {
      if (word !== undefined) (labels as Record<string, unknown>)[name] = word;
    }
    worded.set(given, labels);
  }
  return labels;
}

function within(page: number, count: number | null) {
  const asked = Number.isNaN(page) ? 1 : Math.max(1, Math.floor(page));
  return count === null ? asked : Math.min(asked, Math.max(1, count));
}

function pagesAt(turned: number, state: BookState): number[] {
  const count = state.pageCount ?? Infinity;
  if (state.columns === 1) return [turned + 1];
  return [turned * 2, turned * 2 + 1].filter((page) => page >= 1 && page <= count);
}

function pagesInView(state: BookState): number[] {
  return pagesAt(turnedFor(state.page, state.columns), state);
}

function placeAt(turned: number, state: BookState) {
  return state.labels.pages(pagesAt(turned, state), state.pageCount);
}

function describe(state: BookState) {
  return state.labels.pages(pagesInView(state), state.pageCount);
}

function closedOf(state: BookState): 'front' | 'back' | undefined {
  const turned = turnedFor(state.page, state.columns);
  if (turned === 0) return 'front';
  if (state.pageCount === null) return undefined;
  const all = state.columns === 2 ? leafCount(state.pageCount, 2) : turnLimit(state.pageCount, 1);
  return turned === all ? 'back' : undefined;
}

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

function ribbonHere(state: BookState) {
  return ribbonAt(state) === turnedFor(state.page, state.columns);
}

function canTurn(state: BookState, by: number) {
  const turned = turnedFor(state.page, state.columns) + by;
  const limit = state.pageCount === null ? Infinity : turnLimit(state.pageCount, state.columns);
  return turned >= 0 && turned <= limit;
}

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
