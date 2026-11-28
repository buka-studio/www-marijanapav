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
const PageContext = createContext(-1);
const CanvasContext = createContext(false);
const DRAWABLE: object = { drawable: '' };

function useHandle(part: string) {
  const handle = use(BookContext);
  if (!handle) throw new Error(`${part} must be used inside <Book>.`);
  return handle;
}

type BookProps = BookOptions & PartProps<'div', BookRootState>;

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

type BookView = {
  page: number;
  pages: number[];
  pageCount: number | null;
  columns: Columns;
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

function useBook(): BookView & BookActions {
  const { instance, api } = useHandle('useBook()');
  const last = useRef<{ state: BookState; view: BookView } | undefined>(undefined);
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

function pagesOf(children: ReactNode, path = ''): { page: ReactNode; key: string }[] {
  return Children.toArray(children).flatMap((child, index) => {
    const key = `${path}${isValidElement(child) && child.key !== null ? child.key : index}`;
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return pagesOf(child.props.children, `${key}/`);
    }
    return [{ page: child, key }];
  });
}

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

  useEffect(() => {
    const wanted = wantedRenderer(renderer, fallback, letDown);
    if (wanted && !wanted.ready()) wanted.load();
  }, [renderer, fallback, letDown, drawing]);

  return drawing;
}

function BookCanvas({ renderer, children }: { renderer: BookRenderer; children?: ReactNode }) {
  const handle = useHandle('BookPages');
  const around = renderer.canvas === 'around';
  return usePart(
    handle,
    'canvas',
    { renderer },
    around ? { content: 'drawable', children } : {},
    'canvas',
  );
}

type BookPagesProps = Omit<PartProps<'div', BookPagesState>, 'children'> & {
  children?: ReactNode;
};

function BookPages({ children, ...props }: BookPagesProps) {
  const handle = useHandle('<BookPages>');
  const pages = pagesOf(children);
  const count = pages.length;
  const { renderer, fallback } = handle.state;
  const failed = () => handle.instance.get().letDown;
  const letDown = useSyncExternalStore(handle.instance.subscribe, failed, failed);
  const drawing = useRenderer(renderer, fallback, letDown);
  const inside = drawing?.canvas === 'around';

  useLayoutEffect(() => {
    handle.api.internal.setPageCount(count);
  });

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
      {Array.from({ length: LEAVES }, (_, index) => (
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
      ))}
    </CanvasContext>
  );

  return usePart(
    handle,
    'pages',
    {},
    {
      ...props,
      children: inside ? (
        <BookCanvas renderer={drawing}>{content}</BookCanvas>
      ) : (
        <>
          {content}
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
  hard?: boolean;
  markable?: boolean;
  children?: ReactNode;
};

function BookPage({ hard, markable, children, render, ...props }: BookPageProps) {
  const handle = useHandle('<BookPage>');
  const index = use(PageContext);
  const canvas = use(CanvasContext);
  if (index < 0) throw new Error('<BookPage> must be a child of <BookPages>.');
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

const BookStage: (props: BookStageProps) => ReactNode = parts.Stage;

type BookScrollerProps = ComponentProps<'div'>;

function BookScroller(props: BookScrollerProps): ReactNode {
  return <div data-slot="book-scroller" {...props} />;
}

type BookStepProps = PartProps<'button', BookStepState>;

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

function BookPrevious(props: BookStepProps) {
  return useStep('previous', '<BookPrevious>', props);
}

function BookNext(props: BookStepProps) {
  return useStep('next', '<BookNext>', props);
}

type BookScrubberProps = PartProps<'input', BookScrubberState>;

const BookScrubber: (props: BookScrubberProps) => ReactNode = parts.Scrubber;

type BookThumbnailsProps = PartProps<'div'>;

const BookThumbnails: (props: BookThumbnailsProps) => ReactNode = parts.Thumbnails;

type BookRibbonProps = PartProps<'button', BookRibbonState>;

function BookRibbon(props: BookRibbonProps) {
  return usePart(useHandle('<BookRibbon>'), 'ribbon', { make: createRibbon }, props, 'button');
}

type BookRibbonMarkProps = PartProps<'button', BookRibbonMarkState>;

const TAG =
  'M7 3.5h10a1 1 0 0 1 1 1v15.2a.4.4 0 0 1-.63.33L12 16.2l-5.37 3.83A.4.4 0 0 1 6 19.7V4.5a1 1 0 0 1 1-1z';

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
  page: number;
  children?: ReactNode;
};

function BookThumbnail({ page, children, render, ...props }: BookThumbnailProps) {
  const handle = useHandle('<BookThumbnail>');
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
  param?: string;
};

function BookAddress({ param = 'page' }: BookAddressProps) {
  const handle = useHandle('<BookAddress>');

  useEffect(() => {
    const { instance, api } = handle;
    const read = () => {
      const value = new URL(window.location.href).searchParams.get(param);
      return value !== null && /^\d+$/.test(value) ? Number(value) : undefined;
    };
    let written = instance.get().page;

    const write = () => {
      const state = instance.get();
      if (state.turning || state.dragging || state.page === written) return;
      written = state.page;
      if (read() === state.page) return;
      const url = new URL(window.location.href);
      url.searchParams.set(param, String(state.page));
      try {
        window.history.replaceState(window.history.state, '', url);
      } catch {}
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
