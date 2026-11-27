import {
  announce,
  createChange,
  createController,
  css,
  definePrimitive,
  direct,
  live,
  prepareAnnouncements,
} from '@ui-sdk/core';

import { createEngine } from './book/engine';
import { createGestures } from './book/gestures';
import { createHost } from './book/host';
import { createLamp } from './book/lamp';
import { createRibbonKeeper } from './book/ribbon';
import { createScene, development, locate, reducedMotion } from './book/scene';
import { createScroller } from './book/scroller';
import {
  canTurn,
  closedOf,
  describe,
  labelsOf,
  pagesAt,
  pagesInView,
  placeAt,
  ribbonAt,
  ribbonHere,
  stops,
  within,
  type BookActions,
  type BookController,
  type BookIndicatorState,
  type BookOptions,
  type BookPagesState,
  type BookPageState,
  type BookReason,
  type BookRibbonMarkState,
  type BookRibbonState,
  type BookRootState,
  type BookScrubberState,
  type BookState,
  type BookStepState,
  type BookThumbnailState,
  type MarkDetails,
  type StepDetails,
} from './book/state';
import { createTextures } from './book/textures';
import {
  createTurns,
  facesOf,
  leafCount,
  pageFor,
  sideOf,
  turnedFor,
  turnLimit,
  type Columns,
  type Ribbon,
} from './core';
import type { BookRenderer } from './renderer';

/**
 * A book: pages that turn like paper. This file is its state and its parts; what moves is in `book/`.
 * `page` is the first page in view, counted from 1. It changes the moment a turn is asked for; the leaves catch up.
 */

/** Listeners per controller. Kept here, not by a book, so they hold before it has a book and when it gets another. */
const listening = new WeakMap<object, Set<() => void>>();

function tell(controller: unknown) {
  const listeners =
    typeof controller === 'object' && controller !== null ? listening.get(controller) : undefined;
  for (const listener of Array.from(listeners ?? [])) listener();
}

/** A handle for turning a book's pages from outside it, and for asking where it is open. Pass it as `controller`. */
function createBookController(): BookController {
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  // ui-sdk's handle forwards every name to the book it is attached to. `subscribe` it answers itself.
  const controller = new Proxy(createController<BookController>(), {
    get: (target, key) => (key === 'subscribe' ? subscribe : Reflect.get(target, key)),
  });
  listening.set(controller, listeners);
  return controller;
}

const stepAttrs = (disabled: boolean, id: string) => ({
  type: 'button',
  'aria-controls': `${id}-pages`,
  'aria-disabled': disabled ? 'true' : undefined,
  'data-disabled': disabled ? '' : undefined,
});

/**
 * The most leaves in the air at once, and how many spare leaves a book keeps to show them with. A longer jump
 * turns the first and last of them, and the rest change sides unseen behind those. `maxLeaves` asks for fewer.
 */
const LEAVES = 12;

/** Kept private: whether the book has the pages, a corner peeking, and the renderers that couldn't draw it. */
type Kept = { live: boolean; peeking: boolean; letDown: readonly BookRenderer[] };

/**
 * The primitive behind the React parts. Kept out of the published types: it uses ui-sdk types with no public name yet.
 *
 * @internal
 */
const book = /* @__PURE__ */ definePrimitive({
  name: 'book',
  options: {
    page: 'number',
    defaultPage: 'number',
    onPageChange: 'callback',
    onPageChangeComplete: 'callback',
    pageCount: 'number',
    layout: 'string',
    drag: 'boolean',
    maxLeaves: 'number',
    turnBack: 'string',
    renderer: 'value',
    fallback: 'value',
    labels: 'value',
    bookmark: 'number',
    defaultBookmark: 'number',
    onBookmarkChange: 'callback',
    controller: 'value',
  },
  state: (options: BookOptions): BookState & Kept => ({
    // Clamped to a page the book has: an address may ask for any number.
    page: within(options.defaultPage ?? 1, options.pageCount ?? null),
    pageCount: options.pageCount ?? null,
    layout: options.layout ?? 'auto',
    columns: options.layout === 'single' ? 1 : 2,
    drag: options.drag ?? true,
    renderer: options.renderer,
    fallback: options.fallback,
    labels: labelsOf(options),
    bookmark: options.defaultBookmark ?? null,
    turning: false,
    dragging: false,
    live: false,
    peeking: false,
    letDown: [],
  }),
  live: ['turning', 'dragging', 'live', 'peeking'],
  controlled: ['page', 'bookmark'],
  sync: (options) => ({
    layout: options.layout ?? 'auto',
    drag: options.drag ?? true,
    renderer: options.renderer,
    fallback: options.fallback,
    labels: labelsOf(options),
    ...(options.page === undefined
      ? {}
      : { page: within(options.page, options.pageCount ?? null) }),
    ...(options.bookmark === undefined ? {} : { bookmark: options.bookmark }),
  }),
  api: (context) => {
    const { store } = context;
    const change = createChange(context);
    const scene = createScene();
    const textures = createTextures();
    const state = () => store.get();
    /** The page the leaves last came to rest on. */
    let landed = state().page;
    /** Whether the change being made shows at once, with no leaf seen to turn. */
    let atOnce = false;

    /** Whether a leaf is stiff: either of its pages is marked `hard`. */
    const hard = (leaf: number) => {
      const { columns, pageCount } = state();
      const faces = facesOf(leaf, columns, pageCount ?? 0);
      return (
        scene.papers.get(faces.front)?.hasAttribute('data-hard') === true ||
        scene.papers.get(faces.back)?.hasAttribute('data-hard') === true
      );
    };

    const turnBack = () => (context.options().turnBack === 'reverse' ? 'reverse' : 'mirror');
    /** The most leaves in the air: what was asked for, from 2 to the number of spare leaves. */
    const maxLeaves = () => {
      const asked = context.options().maxLeaves;
      return typeof asked === 'number' && Number.isFinite(asked)
        ? Math.min(LEAVES, Math.max(2, Math.round(asked)))
        : LEAVES;
    };

    // The engine. It exists once the pages are bound, and follows the state.

    const draw = () => {
      const { turns } = scene;
      if (!turns || !host.drawer) return;
      if (turns.active.length > 0) host.uncover();
      host.drawer.draw(turns, scene.aspect, ribbon.strip);
      ribbon.place();
      lamp.follow(turns.active.length > 0);
    };

    const complete = () => {
      const { page } = state();
      if (page === landed) return;
      landed = page;
      context.options().onPageChangeComplete?.(page);
    };

    /** The frame loop: each frame moves the leaves, a drag and the ribbon on, and draws the book. */
    const engine = createEngine({
      step: (time) => {
        const { turns } = scene;
        if (!turns) return undefined;
        const lifting = gestures.peek.lift(time);
        gestures.follow(time);
        const moving = turns.step(time);
        const swaying = ribbon.sway(time);
        draw();
        const turning = moving || lifting || gestures.held;
        // A ribbon still swinging isn't a turn.
        return { turning, moving: turning || swaying };
      },
      rouse: () => ribbon.rouse(),
      turning: (is) => {
        if (state().turning !== is) store.set({ turning: is });
      },
      landed: () => complete(),
    });
    const { wake } = engine;

    /** Sets the leaves up for the current pages and layout, with no motion. */
    const arrange = () => {
      const { turns } = scene;
      if (!turns) return;
      gestures.peek.take();
      const { page, pageCount, columns } = state();
      const count = pageCount ?? 0;
      turns.setLeaves(
        leafCount(count, columns),
        turnLimit(count, columns),
        turnedFor(page, columns),
      );
      turns.setAspect(scene.aspect);
      draw();
      ribbon.settle();
    };

    /** Turns the leaves to where the state says the book is open. */
    const follow = () => {
      const { turns } = scene;
      if (!turns) return;
      const { page, columns } = state();
      const turned = turnedFor(page, columns);
      if (turned === turns.turned) return;
      if (atOnce || reducedMotion()) {
        gestures.peek.take();
        turns.jump(turned);
        draw();
        ribbon.settle();
        complete();
        return;
      }
      // A corner lifted under the pointer joins the turn from where it is.
      gestures.peek.drop();
      turns.setTurnBack(turnBack());
      turns.setMaxActive(maxLeaves());
      turns.turnTo(turned, performance.now(), gestures.heading);
      wake();
    };

    /** Keeps focus on the pages when the page holding it turns out of view. */
    const keepFocus = () => {
      const el = scene.el;
      const focused = el?.ownerDocument.activeElement;
      if (!el || !focused || focused === el || !el.contains(focused)) return;
      const { page, columns } = state();
      for (const [index, paper] of scene.papers) {
        if (paper.contains(focused) && sideOf(index, page, columns) === undefined) {
          el.focus({ preventScroll: true });
          return;
        }
      }
    };

    /** The pages in view: the same array while they are the same pages. */
    let showing = pagesInView(state());
    const inView = () => {
      const now = pagesInView(state());
      if (now.join() !== showing.join()) showing = now;
      return showing;
    };

    // A controller's listeners are told when it gets this book and when it loses it. ui-sdk attaches and
    // detaches after the options are handed over, so they are told in a microtask.
    let held = context.options().controller;
    const later = (controller: unknown) => {
      if (controller) queueMicrotask(() => tell(controller));
    };
    later(held);
    context.onOptions(({ controller }) => {
      if (controller === held) return;
      later(held);
      later(controller);
      held = controller;
    });
    context.onDestroy(() => later(held));

    const watching = new Set<() => void>();
    const changed = () => {
      for (const listener of Array.from(watching)) listener();
      tell(held);
    };

    /** True while the page is put right for a count about to be set: that count arranges the leaves anyway. */
    let counting = false;
    let seen = state();
    context.onDestroy(
      store.subscribe(() => {
        if (counting) return;
        const now = state();
        const previous = seen;
        seen = now;
        const doc = scene.el?.ownerDocument;
        if (
          now.page !== previous.page ||
          now.pageCount !== previous.pageCount ||
          now.columns !== previous.columns
        ) {
          // A book shut by this has one cover to show: with no leaf seen to turn, it is in view at once.
          scroller.settle(atOnce);
        }
        if (now.pageCount !== previous.pageCount || now.columns !== previous.columns) {
          arrange();
        } else if (now.page !== previous.page) {
          keepFocus();
          follow();
          if (doc) announce(describe(now), { doc });
        }
        if (now.bookmark !== previous.bookmark) {
          const gap = ribbonAt(now);
          ribbon.moved();
          if (doc && gap !== null) announce(now.labels.ribbonMoved(placeAt(gap, now)), { doc });
        }
        // What a controller answers has changed. Turning and dragging aren't reported.
        if (
          now.page !== previous.page ||
          now.pageCount !== previous.pageCount ||
          now.columns !== previous.columns ||
          now.bookmark !== previous.bookmark
        ) {
          changed();
        }
      }),
    );

    // Changing page.

    const go = (turned: number, reason: BookReason, event?: Event, instant = false) => {
      const { page, pageCount, columns } = state();
      const limit = pageCount === null ? Infinity : turnLimit(pageCount, columns);
      const target = pageFor(Math.min(limit, Math.max(0, Math.round(turned))), columns);
      if (turnedFor(target, columns) === turnedFor(page, columns)) {
        // Nothing to change, but a dropped leaf may still need putting back.
        queueMicrotask(follow);
        return false;
      }
      // Only a change made here and now can be instant: one the app holds comes later, and turns.
      atOnce = instant;
      let changed = false;
      try {
        changed = change('page', target, { reason, event });
      } finally {
        atOnce = false;
      }
      // Refused, or held by the app: put the leaves back where the state is.
      if (!changed || state().page !== target) queueMicrotask(follow);
      return changed;
    };

    const step = (by: number, { reason = 'imperative', event, instant }: StepDetails = {}) => {
      const { page, columns } = state();
      return go(turnedFor(page, columns) + by, reason, event, instant);
    };

    const last = ({ reason = 'imperative', event, instant }: StepDetails = {}) => {
      const { pageCount, columns } = state();
      return go(turnLimit(pageCount ?? 0, columns), reason, event, instant);
    };

    const setBookmark = (page: number, { reason = 'imperative', event }: MarkDetails = {}) => {
      const now = state();
      // The first of the pages that show together is the one marked.
      const target = pageFor(turnedFor(Math.max(1, Math.floor(page)), now.columns), now.columns);
      if (target === now.bookmark) return false;
      // An unmarkable page makes the pages it shows with unmarkable too: those the ribbon would lie in,
      // which for a cover are the ones inside it.
      const gap = ribbonAt({ ...now, bookmark: target });
      const plain = (page: number) =>
        scene.papers.get(page - 1)?.hasAttribute('data-unmarkable') === true;
      if (gap !== null && pagesAt(gap, now).some(plain)) return false;
      return change('bookmark', target, { reason, event });
    };

    const goToBookmark = ({ reason = 'imperative', event, instant }: StepDetails = {}) => {
      const gap = ribbonAt(state());
      return gap === null ? false : go(gap, reason, event, instant);
    };

    // What moves: the ribbon, a leaf in the hand, and whatever draws them.

    const where = (event: PointerEvent) => locate(scene, state().columns, event);

    const ribbon = createRibbonKeeper({
      scene,
      state,
      locate: where,
      wake,
      peeking: () => gestures.peeking,
      onDestroy: context.onDestroy,
    });

    const scroller = createScroller({ state });

    const gestures = createGestures({
      scene,
      scroller,
      state,
      turnBack,
      hard,
      locate: where,
      wake,
      say: (what, is) => {
        if (state()[what] !== is) store.set({ [what]: is });
      },
      land: (turned, event) => go(turned, 'drag', event),
      restore: () => queueMicrotask(follow),
      onDestroy: context.onDestroy,
    });

    const host = createHost({
      scene,
      state,
      hard,
      refresh: () => {
        ribbon.dress();
        draw();
        ribbon.settle();
      },
      still: () => {
        ribbon.sway(performance.now());
        draw();
      },
      letDown: (renderer) => {
        const { letDown } = state();
        if (!letDown.includes(renderer)) store.set({ letDown: [...letDown, renderer] });
      },
    });

    const lamp = createLamp({ scene, state, textures, folding: () => host.folding });

    /** Reads the layout the stylesheet chose and the shape of a page. */
    const measure = () => {
      const { el, turns } = scene;
      if (!el) return;
      const style = getComputedStyle(el);
      const columns: Columns = style.getPropertyValue('--book-columns').trim() === '1' ? 1 : 2;
      scene.verso = Math.min(
        1,
        Math.max(0, Number.parseFloat(style.getPropertyValue('--book-verso')) || 0),
      );
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) scene.aspect = rect.height / (rect.width / columns);
      scene.across = el.clientWidth;
      // A page's laid-out width, to a fraction of a px, however small the book is drawn.
      textures.bake(el, (Number.parseFloat(style.width) || el.offsetWidth) / columns);
      lamp.resize();
      ribbon.dress();
      if (columns !== state().columns) {
        store.set({ columns });
      } else {
        turns?.setAspect(scene.aspect);
        draw();
        ribbon.settle();
      }
    };

    const bindPages = (el: HTMLElement) => {
      scene.el = el;
      scene.turns = createTurns({ leafCount: 0, stiff: hard, maxActive: maxLeaves() });
      host.arrived();

      const resize = new ResizeObserver(measure);
      resize.observe(el);
      const unlit = lamp.bind(el);
      measure();
      arrange();
      const unscrolled = scroller.bind(el);
      // Told apart from a scroll as it sets off, which only a listener that may stop it can do.
      if (unscrolled) {
        el.addEventListener('touchstart', gestures.touch, { passive: true });
        el.addEventListener('touchmove', gestures.swipe, { passive: false });
      }
      // From here the engine says which pages show, not the server's attributes.
      store.set({ live: true });

      return () => {
        resize.disconnect();
        unlit();
        unscrolled?.();
        el.removeEventListener('touchstart', gestures.touch);
        el.removeEventListener('touchmove', gestures.swipe);
        textures.clear();
        host.left();
        gestures.reset();
        // Leaves that were in the air are gone with the pages: the turn is over, where the book says it is open.
        engine.stop();
        store.set({ live: false, dragging: false, turning: false });
        scene.el = scene.turns = undefined;
        complete();
      };
    };

    /** Bound pages and their place getters: a page keeps its element when others are added, removed or moved. */
    const bound = new Map<HTMLElement, () => number>();

    const bindPage = (el: HTMLElement, place: () => number) => {
      bound.set(el, place);
      // A place another page still has stays that page's until every page has said its place: `shelve` settles it.
      const index = place();
      if (!scene.papers.has(index)) {
        scene.papers.set(index, el);
        draw();
      }
      return () => {
        bound.delete(el);
        for (const [at, paper] of scene.papers) {
          if (paper === el) scene.papers.delete(at);
        }
      };
    };

    /** The mismatched counts, given/actual, already warned about. */
    let miscounted: string | undefined;
    /** The doubled place already warned about. */
    let doubled: number | undefined;

    /** Puts every page at the place it has now. Returns whether any had moved. */
    const shelve = () => {
      const next = new Map<number, HTMLElement>();
      let twice: number | undefined;
      for (const [el, place] of bound) {
        const index = place();
        if (next.has(index)) twice ??= index;
        next.set(index, el);
      }
      // Logged once, not after every render.
      if (development() && twice !== undefined && twice !== doubled) {
        console.error(
          `page-turner: two pages have the same place, page ${twice + 1}. Each <BookPage> must be a child of <BookPages> in its own right: a component that renders several gives them all one place.`,
        );
      }
      doubled = twice;
      let moved = next.size !== scene.papers.size;
      for (const [index, el] of next) moved ||= scene.papers.get(index) !== el;
      if (!moved) return false;
      scene.papers.clear();
      for (const [index, el] of next) scene.papers.set(index, el);
      return true;
    };

    /** Keeps the scrubber's thumb where the book is open. */
    const bindScrubber = (el: HTMLElement) => {
      const input = el as HTMLInputElement;
      const write = () => {
        const { page, columns } = state();
        const value = String(turnedFor(page, columns));
        if (input.value !== value) input.value = value;
      };
      write();
      return store.subscribe(write);
    };

    /** Scrolls the thumbnail strip just far enough to keep the current page's thumbnail in sight. */
    const bindThumbnails = (el: HTMLElement) => {
      let page = state().page;
      const reveal = (smooth: boolean) => {
        const current = el.querySelector<HTMLElement>(
          `[data-slot="book-thumbnail"][data-page="${page}"]`,
        );
        if (!current) return;
        const strip = el.getBoundingClientRect();
        const item = current.getBoundingClientRect();
        const left = Math.min(0, item.left - strip.left) + Math.max(0, item.right - strip.right);
        const top = Math.min(0, item.top - strip.top) + Math.max(0, item.bottom - strip.bottom);
        if (left === 0 && top === 0) return;
        el.scrollBy({ left, top, behavior: smooth && !reducedMotion() ? 'smooth' : 'instant' });
      };
      reveal(false);
      return store.subscribe(() => {
        const next = state().page;
        if (next === page) return;
        page = next;
        reveal(true);
      });
    };

    // Only a book that has asked for a frame has one to cancel; on a server there is none.
    context.onDestroy(() => {
      if (engine.running) engine.stop();
    });

    return {
      setPage: (page: number, { reason = 'imperative', event, instant }: StepDetails = {}) =>
        go(turnedFor(Math.max(1, Math.floor(page)), state().columns), reason, event, instant),
      next: (details?: StepDetails) => step(1, details),
      previous: (details?: StepDetails) => step(-1, details),
      first: ({ reason = 'imperative', event, instant }: StepDetails = {}) =>
        go(0, reason, event, instant),
      last,
      getPage: () => state().page,
      getPages: inView,
      getPageCount: () => state().pageCount,
      getColumns: () => state().columns,
      getBookmark: () => state().bookmark,
      canGoPrevious: () => canTurn(state(), -1),
      canGoNext: () => canTurn(state(), 1),
      subscribe: (listener: () => void) => {
        watching.add(listener);
        return () => {
          watching.delete(listener);
        };
      },
      setBookmark,
      goToBookmark,
      internal: {
        bindPages,
        bindPage,
        bindCanvas: host.bindCanvas,
        keep: host.keep,
        bindRibbon: ribbon.bind,
        tug: ribbon.tug,
        press: gestures.press,
        hover: gestures.hover,
        leave: gestures.leave,
        bindScrubber,
        bindThumbnails,
        /** The keys that turn pages, when the pages element itself has focus: keys inside a page are the page's. */
        key: (event: KeyboardEvent, el: HTMLElement | undefined) => {
          if (event.target !== el || event.defaultPrevented) return;
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          const details = { reason: 'step-key' as const, event };
          // An arrow goes the way a swipe does: to the other page of a spread that scrolls, and on from there.
          const arrow = (side: 'left' | 'right') => () => {
            if (scroller.reaches(side)) scroller.show(side);
            else step(side === 'right' ? 1 : -1, details);
          };
          const turn =
            event.key === 'ArrowRight'
              ? arrow('right')
              : event.key === 'ArrowLeft'
                ? arrow('left')
                : event.key === 'PageDown'
                  ? () => step(1, details)
                  : event.key === 'PageUp'
                    ? () => step(-1, details)
                    : event.key === 'Home'
                      ? () => go(0, 'step-key', event)
                      : event.key === 'End'
                        ? () => last(details)
                        : undefined;
          if (!turn) return;
          turn();
          event.preventDefault();
        },
        scrub: (el: HTMLElement | undefined, event: Event) => {
          const input = el as HTMLInputElement | undefined;
          if (!input) return;
          go(input.valueAsNumber, 'input-change', event);
          // A change the app refused leaves the thumb where the book is.
          const { page, columns } = state();
          input.value = String(turnedFor(page, columns));
        },
        /** Said by the adapter after every render: the same count may be other pages, or another order. */
        setPageCount: (pageCount: number) => {
          const said = context.options().pageCount;
          const wrong =
            said !== undefined && said !== pageCount ? `${said}/${pageCount}` : undefined;
          // Logged once, not after every render.
          if (development() && wrong !== undefined && wrong !== miscounted) {
            console.error(
              `page-turner: pageCount is ${said}, but <BookPages> holds ${pageCount} pages. The server's HTML was made for ${said}.`,
            );
          }
          miscounted = wrong;
          // Pages inserted, removed or moved are other pages in the same places.
          const moved = shelve();
          if (moved) {
            host.forget();
            lamp.resize();
          }
          if (pageCount === state().pageCount) {
            // Same count: laid again where they are now, with nothing seen to turn.
            if (moved) {
              arrange();
              keepFocus();
            }
            return;
          }
          // A book open past its last page, by an address or because pages have gone, is open at the last.
          const page = within(state().page, pageCount);
          const past = page !== state().page;
          if (past) {
            counting = true;
            try {
              // The app is told, and one that holds `page` puts it right itself.
              change('page', page, { reason: 'imperative' });
            } finally {
              counting = false;
            }
          }
          store.set({ pageCount });
          if (moved) keepFocus();
          if (past && state().page === page) complete();
        },
      },
    };
  },
  slots: (slot) => ({
    root: slot<{}, BookRootState>({
      role: 'group',
      state: (state) => ({
        page: state.page,
        pages: pagesInView(state),
        pageCount: state.pageCount,
        columns: state.columns,
      }),
      attrs: (state) => ({
        'aria-roledescription': state.labels.book,
        'data-layout': state.layout,
      }),
      live: live((state) => ({
        'data-turning': state.turning ? '' : undefined,
      })),
      bind: (el) => prepareAnnouncements(el.ownerDocument),
    }),
    // Holds the pages and what lies on them: the ribbon, and the button that moves it.
    stage: slot({}),
    pages: slot<{}, BookPagesState>({
      role: 'group',
      keys: ['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End'],
      state: (state) => ({
        columns: state.columns,
        renderer: state.renderer,
        fallback: state.fallback,
      }),
      // Writes the layout the stylesheet chose as soon as it is read, between renders too.
      direct: direct(['data-columns']),
      attrs: (state, { id }) => ({
        id: `${id}-pages`,
        tabindex: '0',
        'data-columns': String(state.columns),
      }),
      live: live((state) => ({
        'data-live': state.live ? '' : undefined,
        'data-dragging': state.dragging ? '' : undefined,
        'data-peeking': state.peeking ? '' : undefined,
      })),
      // Listened to here, so the app's own handler hears each event first and can keep it from the book.
      on: {
        keydown: (event, { api, el }) => api.internal.key(event as KeyboardEvent, el),
        pointerdown: (event, { api, el }) => api.internal.press(event as PointerEvent, el),
        pointermove: (event, { api }) => api.internal.hover(event as PointerEvent),
        pointerleave: (event, { api }) => api.internal.leave(event as PointerEvent),
      },
      bind: (el, { api }) => api.internal.bindPages(el),
    }),
    canvas: slot<{ renderer?: BookRenderer }>({
      props: { renderer: 'value' },
      attrs: (_state, { props }) => ({
        'data-renderer': props.renderer?.name,
        'data-canvas': props.renderer?.canvas,
        // Pages inside a canvas are still there to be read. A canvas over them is only a picture.
        'aria-hidden': props.renderer?.canvas === 'over' ? 'true' : undefined,
      }),
      bind: (el, { api, props }) => api.internal.bindCanvas(el, props.renderer),
    }),
    page: slot<{ index: number; id?: string; hard?: boolean; markable?: boolean }, BookPageState>({
      role: 'group',
      props: { index: 'number', id: 'id', hard: 'boolean', markable: 'boolean' },
      state: (state, { props }) => ({
        index: props.index,
        side: sideOf(props.index, state.page, state.columns),
        current: props.index === state.page - 1,
        hard: props.hard === true,
        markable: props.markable !== false,
      }),
      attrs: (state, { props }) => {
        const shown = sideOf(props.index, state.page, state.columns) !== undefined;
        return {
          'aria-roledescription': state.labels.page,
          'aria-label': state.labels.pageName(props.index + 1),
          'data-hard': props.hard ? '' : undefined,
          'data-unmarkable': props.markable === false ? '' : undefined,
          // Which side of its leaf it is, which says where its outer edge is.
          'data-face': state.columns === 2 && props.index % 2 === 1 ? 'back' : 'front',
          // Pages out of view leave the tab order and the accessibility tree.
          inert: shown ? undefined : '',
          'aria-hidden': shown ? undefined : 'true',
        };
      },
      // The place is read from the part each time: its props are its newest render's, and a page can move.
      bind: (el, part) => part.api.internal.bindPage(el, () => part.props.index),
    }),
    previous: slot<{}, BookStepState>({
      state: (state) => ({ disabled: !canTurn(state, -1), label: state.labels.previous }),
      attrs: (state, { id }) => stepAttrs(!canTurn(state, -1), id),
      press: ({ api }, event) => {
        api.previous({ reason: 'previous-press', event });
      },
    }),
    next: slot<{}, BookStepState>({
      state: (state) => ({ disabled: !canTurn(state, 1), label: state.labels.next }),
      attrs: (state, { id }) => stepAttrs(!canTurn(state, 1), id),
      press: ({ api }, event) => {
        api.next({ reason: 'next-press', event });
      },
    }),
    indicator: slot<{}, BookIndicatorState>({
      state: (state) => ({
        page: state.page,
        pages: pagesInView(state),
        pageCount: state.pageCount,
        label: describe(state),
      }),
    }),
    // A native range input, so phones' screen readers adjust it with their own gestures.
    // Its value counts turned leaves: every stop is a different view.
    scrubber: slot<{}, BookScrubberState>({
      role: 'slider',
      focus: 'native',
      keys: { none: 'A native range input moves with the keys by itself.' },
      state: (state) => ({
        value: turnedFor(state.page, state.columns),
        max: stops(state),
      }),
      attrs: (state, { id }) => {
        const max = stops(state);
        const value = Math.min(max, turnedFor(state.page, state.columns));
        return {
          type: 'range',
          min: '0',
          max: String(max),
          step: '1',
          value: String(value),
          // The range input's own value says it.
          'aria-valuenow': undefined,
          'aria-valuetext': describe(state),
          'aria-controls': `${id}-pages`,
          disabled: max === 0 ? '' : undefined,
          style: css({ '--book-progress': `${max === 0 ? 0 : (value / max) * 100}%` }),
        };
      },
      on: {
        input: (event, { api, el }) => api.internal.scrub(el, event),
      },
      bind: (el, { api }) => api.internal.bindScrubber(el),
    }),
    thumbnails: slot({
      role: 'group',
      bind: (el, { api }) => api.internal.bindThumbnails(el),
    }),
    thumbnail: slot<{ page: number; id?: string }, BookThumbnailState>({
      props: { page: 'number', id: 'id' },
      state: (state, { props }) => ({
        page: props.page,
        current: pagesInView(state).includes(props.page),
      }),
      attrs: (state, { id, props }) => {
        const current = pagesInView(state).includes(props.page);
        return {
          type: 'button',
          'aria-label': state.labels.goToPage(props.page),
          'aria-controls': `${id}-pages`,
          'aria-current': current ? 'true' : undefined,
          'data-current': current ? '' : undefined,
          'data-page': String(props.page),
        };
      },
      press: ({ api, props }, event) => {
        api.setPage(props.page, { reason: 'item-press', event });
      },
    }),
    // `make` makes the ribbon's cloth. Whoever renders the ribbon brings it, so a book without one doesn't carry it.
    ribbon: slot<{ make?: () => Ribbon }, BookRibbonState>({
      props: { make: 'value' },
      state: (state) => {
        const gap = ribbonAt(state);
        return { page: gap === null ? null : pageFor(gap, state.columns), here: ribbonHere(state) };
      },
      attrs: (state, { id }) => {
        const gap = ribbonAt(state);
        const here = ribbonHere(state);
        return {
          type: 'button',
          'aria-label': state.labels.ribbon(gap === null ? undefined : placeAt(gap, state)),
          'aria-controls': `${id}-pages`,
          'aria-disabled': here || gap === null ? 'true' : undefined,
          'data-here': here ? '' : undefined,
          // Where its tail hangs out: left of the spine once the pages it marks are turned.
          'data-side':
            state.columns === 2 && gap !== null && turnedFor(state.page, state.columns) >= gap
              ? 'left'
              : 'right',
        };
      },
      press: ({ api }, event) => {
        api.goToBookmark({ reason: 'item-press', event });
      },
      on: {
        pointerdown: (event, { api, el }) => api.internal.tug(event as PointerEvent, el),
      },
      bind: (el, { api, props }) => api.internal.bindRibbon(el, props.make),
    }),
    // Lays the ribbon in the pages in view.
    'ribbon-mark': slot<{}, BookRibbonMarkState>({
      state: (state) => ({ marked: ribbonHere(state) }),
      attrs: (state, { id }) => {
        const marked = ribbonHere(state);
        // The ribbon lies between two leaves, so a closed book has nowhere for it.
        const closed = closedOf(state) !== undefined;
        return {
          type: 'button',
          'aria-controls': `${id}-pages`,
          'aria-disabled': marked || closed ? 'true' : undefined,
          'data-disabled': marked || closed ? '' : undefined,
          'data-marked': marked ? '' : undefined,
          'data-closed': closed ? '' : undefined,
        };
      },
      press: ({ api, store }, event) => {
        if (closedOf(store.get()) === undefined)
          api.setBookmark(store.get().page, { reason: 'press', event });
      },
    }),
  }),
  agent: {
    actions: ['setPage', 'next', 'previous', 'first', 'last', 'setBookmark', 'goToBookmark'],
  },
});

export { book, createBookController, LEAVES };
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
} from './book/state';
export type { Columns, TurnBack } from './core';
export type { BookRenderer } from './renderer';
