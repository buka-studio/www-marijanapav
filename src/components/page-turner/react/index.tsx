'use client';

import {
  createParts,
  renderElement,
  usePart,
  usePrimitive,
  type PartProps,
  type PrimitiveHandle,
} from '@ui-sdk/react/primitive';
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from 'react';

import {
  book,
  createBookController,
  LEAVES,
  type BookActions,
  type BookController,
  type BookIndicatorState,
  type BookOptions,
  type BookPagesState,
  type BookPageState,
  type BookRenderer,
  type BookRibbonMarkState,
  type BookRibbonState,
  type BookRootState,
  type BookScrubberState,
  type BookStepState,
  type BookThumbnailState,
} from '../book';
import { canTurn, pagesInView, type BookState } from '../book/state';
import { createRibbon, type Columns } from '../core';
import { readyRenderer, wantedRenderer } from '../renderer';

type BookHandle = PrimitiveHandle<typeof book>;

const BookContext = createContext<BookHandle | null>(null);
/** A page's place among its siblings, counted from 0. */
const PageContext = createContext(-1);
/** Whether the pages are inside a canvas that draws them. */
const CanvasContext = createContext(false);
/** html-in-canvas: the attribute marking an element a canvas may draw. React's types don't know it. */
const DRAWABLE: object = { drawable: '' };

function useHandle(part: string) {
  const handle = use(BookContext);
  if (!handle) throw new Error(`${part} must be used inside <Book>.`);
  return handle;
}

type BookProps = BookOptions & PartProps<'div', BookRootState>;

/**
 * A book whose pages turn like paper. Name it with `aria-label`.
 *
 * @example
 * <Book aria-label="Field guide">
 *   <BookPages>
 *     <BookPage>Cover</BookPage>
 *     <BookPage>First page</BookPage>
 *   </BookPages>
 *   <BookPrevious>Previous</BookPrevious>
 *   <BookNext>Next</BookNext>
 * </Book>
 */
function Book({
  page,
  defaultPage,
  onPageChange,
  onPageChangeComplete,
  pageCount,
  layout,
  drag,
  maxLeaves,
  turnBack,
  renderer,
  fallback,
  labels,
  bookmark,
  defaultBookmark,
  onBookmarkChange,
  controller,
  debug,
  children,
  ...props
}: BookProps) {
  const handle = usePrimitive(book, {
    page,
    defaultPage,
    onPageChange,
    onPageChangeComplete,
    pageCount,
    layout,
    drag,
    maxLeaves,
    turnBack,
    renderer,
    fallback,
    labels,
    bookmark,
    defaultBookmark,
    onBookmarkChange,
    controller,
    debug,
  });
  const provide = (content: ReactNode) => <BookContext value={handle}>{content}</BookContext>;

  return usePart(
    handle,
    'root',
    {},
    {
      ...props,
      children:
        typeof children === 'function' ? (state) => provide(children(state)) : provide(children),
    },
    'div',
  );
}

/** The book state `useBook` returns. */
type BookView = {
  /** The first page in view, counted from 1. */
  page: number;
  /** Every page in view. */
  pages: number[];
  pageCount: number | null;
  /** How many pages show side by side. */
  columns: Columns;
  /** The page the ribbon marks, or null. */
  bookmark: number | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
};

function viewOf(state: BookState): BookView {
  return {
    page: state.page,
    pages: pagesInView(state),
    pageCount: state.pageCount,
    columns: state.columns,
    bookmark: state.bookmark,
    canGoPrevious: canTurn(state, -1),
    canGoNext: canTurn(state, 1),
  };
}

/**
 * The book a component is inside: where it is open, and the means to turn it. For a part of your own,
 * like a table of contents. Re-renders when the book opens elsewhere, not while leaves are in the air.
 *
 * @example
 * function Contents() {
 *   const book = useBook()
 *   return <button onClick={() => book.setPage(4)}>Chapter one</button>
 * }
 */
function useBook(): BookView & BookActions {
  const { instance, api } = useHandle('useBook()');
  const last = useRef<{ state: BookState; view: BookView } | undefined>(undefined);
  // Returns the same view until one of its fields changes; turning and dragging aren't among them.
  const read = () => {
    const state = instance.get();
    const was = last.current;
    if (was?.state === state) return was.view;
    const view = viewOf(state);
    const same =
      was !== undefined &&
      (Object.keys(view) as (keyof BookView)[]).every((key) =>
        key === 'pages' ? view.pages.join() === was.view.pages.join() : view[key] === was.view[key],
      );
    last.current = { state, view: same ? was.view : view };
    return last.current.view;
  };
  const view = useSyncExternalStore(instance.subscribe, read, read);
  return useMemo(
    () => ({
      ...view,
      setPage: api.setPage,
      next: api.next,
      previous: api.previous,
      first: api.first,
      last: api.last,
      setBookmark: api.setBookmark,
      goToBookmark: api.goToBookmark,
    }),
    [view, api],
  );
}

/** The pages among `children`, each with a key of its own. Fragments are flattened. */
function pagesOf(children: ReactNode, path = ''): { page: ReactNode; key: string }[] {
  return Children.toArray(children).flatMap((child, index) => {
    const key = `${path}${isValidElement(child) && child.key !== null ? child.key : index}`;
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return pagesOf(child.props.children, `${key}/`);
    }
    return [{ page: child, key }];
  });
}

/**
 * The renderer to draw with now: none on the server or during the takeover of its HTML, so the two agree.
 * `letDown` are the renderers that couldn't draw this book.
 */
function useRenderer(
  renderer: BookRenderer | undefined,
  fallback: BookRenderer | undefined,
  letDown: readonly BookRenderer[],
) {
  const watch = useCallback(
    (listener: () => void) => {
      const stops = [renderer?.watch(listener), fallback?.watch(listener)];
      return () => stops.forEach((stop) => stop?.());
    },
    [renderer, fallback],
  );
  const drawing = useSyncExternalStore(
    watch,
    () => readyRenderer(renderer, fallback, letDown),
    () => undefined,
  );

  // Loads what the renderer this browser should use needs. When one lets the book down, that is another.
  useEffect(() => {
    const wanted = wantedRenderer(renderer, fallback, letDown);
    if (wanted && !wanted.ready()) wanted.load();
  }, [renderer, fallback, letDown, drawing]);

  return drawing;
}

function BookCanvas({ renderer, children }: { renderer: BookRenderer; children?: ReactNode }) {
  const handle = useHandle('BookPages');
  const around = renderer.canvas === 'around';
  // html-in-canvas: a canvas that draws its own children says so.
  return usePart(
    handle,
    'canvas',
    { renderer },
    around ? { content: 'drawable', children } : {},
    'canvas',
  );
}

type BookPagesProps = Omit<PartProps<'div', BookPagesState>, 'children'> & {
  /**
   * The pages, each a `BookPage`, in reading order. A page's place is its place among these children, so each
   * is a direct child, or in a fragment or an array: a component of yours may render one `BookPage`, not several.
   */
  children?: ReactNode;
};

/** Where the pages sit and turn. Its children are the pages. */
function BookPages({ children, ...props }: BookPagesProps) {
  const handle = useHandle('<BookPages>');
  const pages = pagesOf(children);
  const count = pages.length;
  const { renderer, fallback } = handle.state;
  // Subscribed to separately: `letDown` isn't in the part's state, so nothing else re-renders the pages for it.
  const failed = () => handle.instance.get().letDown;
  const letDown = useSyncExternalStore(handle.instance.subscribe, failed, failed);
  const drawing = useRenderer(renderer, fallback, letDown);
  const inside = drawing?.canvas === 'around';

  // After every render: the same count may be other pages, or the same in another order.
  // Each page has said where it is by now, and the book puts them there.
  useLayoutEffect(() => {
    handle.api.internal.setPageCount(count);
  });

  // Takeover of the server's folding HTML by a browser where the pages go inside a canvas next: a copy of how
  // they look now covers the change. Made once everything in the book is in place, before React draws anything else.
  useEffect(() => {
    if (!drawing && readyRenderer(renderer, fallback, letDown)?.canvas === 'around')
      handle.api.internal.keep();
  }, [handle, drawing, renderer, fallback, letDown]);

  const content = (
    <CanvasContext value={inside}>
      {pages.map(({ page, key }, index) => (
        <PageContext key={key} value={index}>
          {page}
        </PageContext>
      ))}
      {
        /* Spare blank pages, enough for every leaf that can be in the air at once. */
        Array.from({ length: LEAVES }, (_, index) => (
          <div key={`blank-${index}`} data-slot="book-page-frame" data-blank="" aria-hidden="true">
            {inside ? (
              <div data-slot="book-page" data-blank="" {...DRAWABLE} />
            ) : (
              <div data-slot="book-page-clip">
                <div data-slot="book-page-cast">
                  <div data-slot="book-page-shadow" />
                </div>
                <div data-slot="book-page" data-blank="">
                  <div data-slot="book-page-finish" />
                  <div data-slot="book-page-shade" />
                </div>
              </div>
            )}
          </div>
        ))
      }
    </CanvasContext>
  );

  return usePart(
    handle,
    'pages',
    {},
    {
      ...props,
      // In a canvas the pages are still elements, laid out and reachable; the canvas draws them.
      children: inside ? (
        <BookCanvas renderer={drawing}>{content}</BookCanvas>
      ) : (
        <>
          {content}
          {/* Where a ribbon is drawn among folding pages. It stays under a canvas that lies over
              them, though nothing draws it then, so it is there to copy as the canvas comes. */}
          <svg data-slot="book-strip" aria-hidden="true" focusable="false">
            <path data-part="shadow" />
            <path data-part="cloth" />
            <path data-part="sheen" />
            <path data-part="under" />
            <path data-part="over" />
            <path data-part="over-sheen" />
          </svg>
          {drawing && (
            <>
              <BookCanvas renderer={drawing} />
              {/* The ring round whatever has focus, where the browser's own is under the canvas. */}
              <div data-slot="book-focus" aria-hidden="true" hidden />
            </>
          )}
        </>
      ),
    },
    'div',
  );
}

type BookPageProps = Omit<PartProps<'div', BookPageState>, 'children'> & {
  /**
   * Whether the page is stiff, like a cover: its leaf swings on the spine and doesn't fold. It is drawn as a board
   * covered as the `--book-cover-*` custom properties say, and where pages curl, thick and a little larger than them.
   */
  hard?: boolean;
  /**
   * Whether the ribbon can be laid here. While a page that says `false` is in view, `BookRibbonMark` isn't
   * there and `setBookmark` leaves the ribbon where it is.
   */
  markable?: boolean;
  children?: ReactNode;
};

/** One page. Its class name and style go on the paper. */
function BookPage({ hard, markable, children, render, ...props }: BookPageProps) {
  const handle = useHandle('<BookPage>');
  const index = use(PageContext);
  const canvas = use(CanvasContext);
  if (index < 0) throw new Error('<BookPage> must be a child of <BookPages>.');
  // Each page is a part of its own, told apart by this id.
  const id = useId();

  return usePart(
    handle,
    'page',
    { index, id, hard, markable },
    {
      ...props,
      ...(canvas ? DRAWABLE : undefined),
      children: canvas ? (
        children
      ) : (
        <>
          {children}
          <div data-slot="book-page-finish" aria-hidden="true" />
          <div data-slot="book-page-shade" aria-hidden="true" />
        </>
      ),
      // The paper sits inside a page-sized frame. To fold, it also sits in the
      // box that cuts it along a crease; a canvas bends it without one.
      render: (part, state) => (
        <div
          data-slot="book-page-frame"
          data-rest={state.side}
          data-current={state.current ? '' : undefined}
        >
          {canvas ? (
            renderElement('div', part, render, state)
          ) : (
            <div data-slot="book-page-clip">
              <div data-slot="book-page-cast">
                <div data-slot="book-page-shadow" />
              </div>
              {renderElement('div', part, render, state)}
            </div>
          )}
        </div>
      ),
    },
    'div',
  );
}

const parts = createParts(book, {
  stage: 'div',
  scrubber: 'input',
  thumbnails: 'div',
});

type BookStageProps = PartProps<'div'>;

/**
 * Holds the pages and what lies on them: it is the size of the pages, and a `BookRibbon` and a
 * `BookRibbonMark` are placed by it. A book with a ribbon needs one.
 *
 * @example
 * <BookStage>
 *   <BookPages>…</BookPages>
 *   <BookRibbon />
 *   <BookRibbonMark />
 * </BookStage>
 */
const BookStage: (props: BookStageProps) => ReactNode = parts.Stage;

type BookScrollerProps = ComponentProps<'div'>;

/**
 * A box around the `Book` for its spread to scroll across in, where there isn't room for both pages: one is in
 * view at a time, the box snaps to either, and a swipe that has nowhere left to scroll to turns the leaf. Where the
 * spread fits it does nothing.
 *
 * @example
 * <BookScroller>
 *   <Book>…</Book>
 * </BookScroller>
 */
function BookScroller(props: BookScrollerProps): ReactNode {
  return <div data-slot="book-scroller" {...props} />;
}

type BookStepProps = PartProps<'button', BookStepState>;

/** A button that turns a leaf. With no content and no name given, it is named from the book's labels. */
function useStep(slot: 'previous' | 'next', part: string, props: BookStepProps) {
  const handle = useHandle(part);
  const named =
    props.children !== undefined ||
    props['aria-label'] !== undefined ||
    props['aria-labelledby'] !== undefined;
  return usePart(
    handle,
    slot,
    {},
    { ...(named ? undefined : { 'aria-label': handle.state.labels[slot] }), ...props },
    'button',
  );
}

/**
 * Turns back a page. Give it text. Empty, it is named "Previous page", which `labels` can change; around an
 * icon, `children` can be a function of `{ disabled, label }` that puts the label where a screen reader finds it.
 */
function BookPrevious(props: BookStepProps) {
  return useStep('previous', '<BookPrevious>', props);
}

/** Turns to the next page. Named as `BookPrevious` is: "Next page" when empty. */
function BookNext(props: BookStepProps) {
  return useStep('next', '<BookNext>', props);
}

type BookScrubberProps = PartProps<'input', BookScrubberState>;

/** A slider that riffles through the book: a native range input the stylesheet restyles. Name it with `aria-label`. */
const BookScrubber: (props: BookScrubberProps) => ReactNode = parts.Scrubber;

type BookThumbnailsProps = PartProps<'div'>;

/** A strip of `BookThumbnail`s. Name it with `aria-label`. */
const BookThumbnails: (props: BookThumbnailsProps) => ReactNode = parts.Thumbnails;

type BookRibbonProps = PartProps<'button', BookRibbonState>;

/**
 * The ribbon that marks a place: a button that opens the book there and says where. Its tail can be pulled about;
 * its colour is its text colour. Goes in a `BookStage`, after the `BookPages`. `BookRibbonMark` and `bookmark` move it.
 */
function BookRibbon(props: BookRibbonProps) {
  return usePart(useHandle('<BookRibbon>'), 'ribbon', { make: createRibbon }, props, 'button');
}

type BookRibbonMarkProps = PartProps<'button', BookRibbonMarkState>;

/** A bookmark's shape: a tag cut to a swallowtail. Drawn once as a line and once filled in. */
const TAG =
  'M7 3.5h10a1 1 0 0 1 1 1v15.2a.4.4 0 0 1-.63.33L12 16.2l-5.37 3.83A.4.4 0 0 1 6 19.7V4.5a1 1 0 0 1 1-1z';

/**
 * Moves the ribbon to the pages in view. Empty, it is an outlined bookmark named "Mark this page", filled in under
 * the pointer and while those pages are the ones marked; in a `BookStage` it lies on the page, by the top outer
 * corner and clear of the edge the page turns by. Or give it text of your own, and put it anywhere in the book.
 */
function BookRibbonMark({ children, ...props }: BookRibbonMarkProps) {
  const handle = useHandle('<BookRibbonMark>');
  const named =
    children !== undefined ||
    props['aria-label'] !== undefined ||
    props['aria-labelledby'] !== undefined;
  return usePart(
    handle,
    'ribbon-mark',
    {},
    {
      ...(named ? undefined : { 'aria-label': handle.state.labels.mark }),
      ...props,
      children: children ?? (
        <svg
          data-slot="book-ribbon-mark-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path data-part="fill" d={TAG} />
          <path data-part="line" d={TAG} />
        </svg>
      ),
    },
    'button',
  );
}

type BookIndicatorProps = PartProps<'span', BookIndicatorState>;

/** Says which pages are in view, like "Pages 2–3 of 12". Pass a function as children to say it your way. */
function BookIndicator({ children, ...props }: BookIndicatorProps) {
  return usePart(
    useHandle('<BookIndicator>'),
    'indicator',
    {},
    { ...props, children: children ?? ((state) => state.label) },
    'span',
  );
}

type BookThumbnailProps = Omit<PartProps<'button', BookThumbnailState>, 'children'> & {
  /** The page it opens the book to, counted from 1. */
  page: number;
  /** What the small page shows: the page's own content again, or a picture of it. */
  children?: ReactNode;
};

/**
 * A button that opens the book to a page, drawn as that page in miniature. The miniature is a picture beside
 * the button, which lies over it: what's in it can't be reached or read out. Class name and style go on the button.
 */
function BookThumbnail({ page, children, render, ...props }: BookThumbnailProps) {
  const handle = useHandle('<BookThumbnail>');
  // Each thumbnail is a part of its own, told apart by this id.
  const id = useId();
  return usePart(
    handle,
    'thumbnail',
    { page, id },
    {
      ...props,
      render: (part, state) => (
        <span data-slot="book-thumbnail-frame" data-current={state.current ? '' : undefined}>
          <span data-slot="book-thumbnail-page" aria-hidden="true" inert>
            {children}
          </span>
          {renderElement('button', part, render, state)}
        </span>
      ),
    },
    'button',
  );
}

type BookAddressProps = {
  /** Name of the query parameter that holds the page. Default `page`. */
  param?: string;
};

/**
 * Keeps the page in view in the address bar, as a query parameter, so a reload, a bookmark or a shared link
 * opens the book where it was. It renders nothing and only writes the address: whoever renders the book reads
 * the parameter and passes it as `defaultPage`, which puts those pages in the server's HTML. The address is
 * rewritten in place when a turn lands, adding no history; going back or forward to another page turns the book.
 *
 * @example
 * // app/guide/page.tsx
 * export default async function Page({ searchParams }: PageProps<"/guide">) {
 *   const { page } = await searchParams
 *   return (
 *     <Book defaultPage={Number(page) || 1}>
 *       <BookAddress />
 *       …
 *     </Book>
 *   )
 * }
 */
function BookAddress({ param = 'page' }: BookAddressProps) {
  const handle = useHandle('<BookAddress>');

  useEffect(() => {
    const { instance, api } = handle;
    const read = () => {
      const value = new URL(window.location.href).searchParams.get(param);
      return value !== null && /^\d+$/.test(value) ? Number(value) : undefined;
    };
    // The address is left alone until the book has moved from where it started.
    let written = instance.get().page;

    const write = () => {
      const state = instance.get();
      // Once the leaves have landed: browsers limit how often an address may be rewritten.
      if (state.turning || state.dragging || state.page === written) return;
      written = state.page;
      if (read() === state.page) return;
      const url = new URL(window.location.href);
      url.searchParams.set(param, String(state.page));
      try {
        window.history.replaceState(window.history.state, '', url);
      } catch {
        // The address can't be written here, or has been too often. The book still turns.
      }
    };

    const follow = () => {
      const page = read();
      if (page === undefined || page === instance.get().page) return;
      written = page;
      api.setPage(page);
    };

    const stop = instance.subscribe(write);
    window.addEventListener('popstate', follow);
    return () => {
      stop();
      window.removeEventListener('popstate', follow);
    };
  }, [handle, param]);

  return null;
}

export {
  Book,
  BookAddress,
  BookIndicator,
  BookNext,
  BookPage,
  BookPages,
  BookPrevious,
  BookRibbon,
  BookRibbonMark,
  BookScroller,
  BookScrubber,
  BookStage,
  BookThumbnail,
  BookThumbnails,
  createBookController,
  useBook,
};
export type {
  BookAddressProps,
  BookIndicatorProps,
  BookPageProps,
  BookPagesProps,
  BookProps,
  BookRibbonMarkProps,
  BookRibbonProps,
  BookScrollerProps,
  BookScrubberProps,
  BookStageProps,
  BookStepProps,
  BookThumbnailProps,
  BookThumbnailsProps,
  BookView,
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
  BookRenderer,
  BookRibbonMarkState,
  BookRibbonState,
  BookRootState,
  BookScrubberState,
  BookStepState,
  BookThumbnailState,
  Columns,
  MarkDetails,
  StepDetails,
  TurnBack,
} from '../book';
