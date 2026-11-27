/**
 * Flies a book to the middle of the window and back.
 *
 * It leaves one of two ways. `thrown` out of a button, the shut book starts
 * small and grows as it comes. `lifted` from where a book like it lies on
 * the page, it starts as that book, the same size and in the same place, and
 * goes over. Either way it turns once round in the air, and begins to open
 * while it is still coming to rest. Going back is the same played backward:
 * its leaves turn back, its cover shuts, and it goes home.
 *
 * A book read to its end lies shut already, its back cover up, and goes home
 * as it lies: half a turn in the air brings its front cover round.
 *
 * One clock says how far out the book is, and where the book is, how large,
 * how far round and how dim the page behind it are all read off that clock.
 * So it can be turned back at any moment, part-way out or part-way home, and
 * goes on from where it is.
 *
 * Only `transform` and `opacity` change while it flies.
 */

const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Fast away and gently to rest: for what comes into view. */
const outCubic = (t: number) => 1 - (1 - t) ** 3;
const outQuart = (t: number) => 1 - (1 - t) ** 4;
/** For what is already in view and moves across it. */
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
/** Gently off and gently to rest, with no hurry between: for what dims where it is. */
const inOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

interface Way {
  /** How long the book is in the air, in ms. */
  flight: number;
  /** How far into its flight it begins to open. A thrown book has all but come round to face the reader by then. */
  opens: number;
  /** How long it takes to show as it sets out, in ms. A book that was there already takes none. */
  shows: number;
  /**
   * How many frames it lies drawn where it starts before it moves. A book
   * lifted from one on the page takes that one's place, and a book just made
   * may not be painted in its first frames: the two lie one over the other
   * until it is.
   */
  waits: number;
  /**
   * How the page behind it dims: this long after the book sets out, and over
   * this long, in ms. It waits until the book is seen to have left, and is
   * dim by the time the book begins to open. Going home it is the same
   * played backward: light again just before the book lands.
   */
  dims: { after: number; over: number };
  /** How it gets there, and how it comes round, which is done sooner. */
  ease: (t: number) => number;
  round: (t: number) => number;
  /**
   * How many times it turns round on the way. It turns the way its cover
   * opens, its fore-edge coming forward and over to the left, so the cover
   * swinging open goes on from it; and the way its cover shuts, going back.
   */
  turns: number;
  /** How far it leans back at the top of its flight, and how far it banks into the way it is going, in degrees. */
  lean: number;
  bank: number;
  /** How high it rises above the straight way there, in book heights. */
  rise: number;
  /**
   * How large it sets out: as tall as what it leaves, times this, and no
   * more than `most` of its full size.
   */
  small: { tall: number; most: number };
}

const WAYS = {
  thrown: {
    flight: 900,
    opens: 400,
    shows: 60,
    waits: 0,
    dims: { after: 60, over: 300 },
    ease: outCubic,
    round: outQuart,
    turns: 1,
    lean: 14,
    bank: 0,
    rise: 0.07,
    small: { tall: 1.5, most: 0.5 },
  },
  lifted: {
    flight: 950,
    opens: 470,
    shows: 0,
    waits: 5,
    dims: { after: 180, over: 340 },
    ease: inOutCubic,
    // It leaves the page as gently as it sets out, and is round by two thirds of the way.
    round: (t) => inOutCubic(clamp(t / 0.68)),
    turns: 1,
    lean: 8,
    bank: 0,
    rise: 0.05,
    small: { tall: 1, most: 1 },
  },
} satisfies Record<string, Way>;

/** How far through its flight the book still shows its other sides. Past that it faces the reader, near enough. */
const SOLID = 0.9;
/** How far the eye is from the book, in page widths. */
const EYE = 3.2;
/**
 * A shut book lies in the middle of the window, and so does an open one, so
 * a book slides across by half a page as its cover swings: this long, in ms.
 */
const SLIDE = 520;
/**
 * How the book turns its leaves back, which says how long to wait before
 * flying home: this long between two leaves lifting, in ms, at most this
 * many of them seen to turn, and this long from the last page lifting to the
 * cover beginning to shut after it.
 *
 * A book turned round while it is still opening has only to gather the
 * leaves that have left: its pages lift this long after its cover, and it
 * needs as long as they have been in the air, and this much again.
 */
const BACK = { between: 70, most: 12, cover: 430, pages: 290, gather: 250 };

/** Where a book lies in its own width: its front cover shut on the right, open, or its back cover shut on the left. */
type Lying = 0 | 1 | 2;
const LYING = ['front', 'open', 'back'] as const;

interface FlightOptions {
  /** How the book leaves. Defaults to `thrown`. */
  way?: keyof typeof WAYS;
  /** What the book leaves, and goes back to: a button it is thrown out of, or a book like it that it is lifted from. */
  from(): HTMLElement | null;
  /** Opens the book where it is to be read. */
  open(): void;
  /** Shuts the book. Says how many leaves it had turned. */
  shut(): number;
  /**
   * Turns the book to its last page. Given, a book open past its middle shuts at its back cover,
   * which is nearer, and goes home with that up, as one read to its end does.
   */
  last?(): void;
  /** Puts the book at its front cover at once, with no leaf seen to turn. */
  front(): void;
  /** How many pages the book shows side by side, as it is laid out now. */
  columns(): 1 | 2;
  /** Told when the book has left, and when it is home again: what it was lifted from isn't there meanwhile. */
  away?(away: boolean): void;
}

interface Geometry {
  /** The book's width and height at rest, in px, and the width of one page. */
  width: number;
  height: number;
  page: number;
  /** How far the middle of what it leaves is from the middle of the shut book at rest. */
  dx: number;
  dy: number;
  /** How far the middle of the book at rest is from the middle of the window: a single page makes room on its left. */
  off: number;
  /** How large the book is as it sets out, where 1 is full size. */
  small: number;
  /** How far what the book scrolls in was scrolled when this was read, in px. */
  scrolled: number;
}

function still() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** How long a book with `leaves` turned takes to turn them back before its cover starts to shut. */
function lead(leaves: number) {
  return leaves < 2 ? 0 : (Math.min(leaves, BACK.most) - 2) * BACK.between + BACK.cover;
}

function createFlight(options: FlightOptions) {
  const way: Way = WAYS[options.way ?? 'thrown'];

  /** The box that flies, and the one inside it that turns round. */
  let flyer: HTMLElement | undefined;
  let spinner: HTMLElement | undefined;
  /** What the book scrolls across in, where it is wider than the window. */
  let scroller: HTMLElement | undefined;
  /** What comes and goes with the book: the backdrop, and the button that closes it. */
  const faders = new Set<HTMLElement>();

  let frame = 0;
  let then = 0;
  /** How far into its flight the book is, in ms: 0 where it leaves from, `way.flight` at rest in the window. */
  let at = 0;
  let heading: 1 | -1 = -1;
  /** Whether the book has been asked to open since it last set out, and when. */
  let opened = false;
  let openedAt = 0;
  /** When a book going back may leave, which is once its leaves have all but turned back. */
  let departs = 0;
  /** Whether it has been said to be away. */
  let away = false;
  /** How many frames it has lain drawn where it starts. */
  let lain = 0;
  let geometry: Geometry | undefined;
  /** What keeps the dialog on the page until the book is home: it waits for whatever is moving in it. */
  let hold: Animation | undefined;

  /** How the book lies now, where it is sliding from and to, and when it starts to. */
  let lying = 0;
  let slide = { from: 0, to: 0 as Lying, at: 0 };
  /** How many leaves were last known to be turned, and how many are when the book has been read to its end. */
  let turned = 0;
  let end = 0;

  /**
   * How far round the book is, in degrees, at rest in the window and where
   * it leaves from. Between the two it is as far round as `way.round` says.
   */
  let spin = { far: 0, near: 360 * way.turns };
  /**
   * Whether it is going home with its back cover up. It is until it has come
   * round edge-on, where neither cover is seen: there it is put at its front
   * cover, and that is the one that comes into view.
   */
  let over = false;

  /** Whether any of the book's leaves are in the air. */
  const turning = () =>
    flyer?.querySelector('[data-slot="book"]')?.hasAttribute('data-turning') === true;
  const { columns } = options;

  /** How far round the book is, in degrees. */
  const angle = () => spin.far + (spin.near - spin.far) * (1 - way.round(clamp(at / way.flight)));

  /**
   * Says how far round the book is to be at one end of its flight. The other
   * end gives, so the book is no further round now than it was: turned back
   * part-way, it goes on from where it is.
   */
  function aim(end: 'far' | 'near', to: number) {
    const part = 1 - way.round(clamp(at / way.flight));
    const now = angle();
    if (end === 'far')
      spin = { far: to, near: part > 0 ? to + (now - to) / part : to + spin.near - spin.far };
    else spin = { far: part < 1 ? (now - to * part) / (1 - part) : 0, near: to };
  }

  /**
   * Puts a book that is edge-on at its front cover, which is the other way
   * round: half a turn further on, and in the other half of its width.
   */
  function turnOver() {
    over = false;
    flyer?.removeAttribute('data-back');
    spin = { far: spin.far - 180, near: spin.near - 180 };
    if (slide.to === 2) {
      slide = { from: 2 - slide.from, to: 0, at: slide.at };
      flyer?.setAttribute('data-lying', LYING[0]);
    }
    // Told of the page it is at now, the flight has nothing left to wait for.
    turned = 0;
    options.front();
  }

  function say(now: boolean) {
    if (away === now) return;
    away = now;
    options.away?.(now);
  }

  /** Reads where the book rests and where it leaves from, with the book put down where it rests. */
  function measure(): Geometry | undefined {
    if (!flyer || !spinner) return undefined;
    flyer.style.transform = spinner.style.transform = 'none';
    const box = spinner.getBoundingClientRect();
    if (box.width === 0) return undefined;
    const from = options.from()?.getBoundingClientRect();
    const page = box.width / columns();
    // For the stylesheet: the book's other sides, and the ring round it, are sized by it.
    flyer.style.setProperty('--page', `${page.toFixed(2)}px`);
    return {
      width: box.width,
      height: box.height,
      page,
      dx: from ? from.left + from.width / 2 - (box.left + box.width / 2) : 0,
      dy: from ? from.top + from.height / 2 - (box.top + box.height / 2) : 0,
      off: box.left + box.width / 2 - document.documentElement.clientWidth / 2,
      small: from
        ? Math.min(way.small.most, (from.height * way.small.tall) / box.height)
        : way.small.most / 2,
      scrolled: scroller?.scrollLeft ?? 0,
    };
  }

  /** Puts the book, and what comes with it, where the clock says they are. */
  function draw() {
    const g = geometry;
    if (!flyer || !spinner || !g) return;
    const progress = clamp(at / way.flight);
    const gone = way.ease(progress);
    const flying = progress < 1;
    /** 0 at either end of the flight and 1 at the top of it. */
    const height = Math.sin(Math.PI * gone);

    const scale = g.small + (1 - g.small) * gone;
    // How far the middle of the book as it lies is from the middle of the open book.
    const aside = ((g.width - g.page) / 2) * (1 - lying);
    // Where the book rests has moved by as far as it has been scrolled since it was measured.
    const scrolled = (scroller?.scrollLeft ?? 0) - g.scrolled;
    // And a shut book lies in the middle of the window, at either cover, wherever an open one lies.
    const x =
      (g.dx + scrolled) * (1 - gone) -
      aside * scale -
      (g.off - scrolled) * gone * Math.abs(1 - lying);
    const y = g.dy * (1 - gone) - way.rise * g.height * height;
    const moved = flying || Math.abs(x) > 0.01;
    flyer.style.transform = moved
      ? `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`
      : '';
    flyer.style.opacity = way.shows === 0 ? '1' : clamp(at / way.shows).toFixed(3);
    flyer.toggleAttribute('data-flying', flying);
    // Its other sides are there to be seen until it has all but stopped turning.
    flyer.toggleAttribute('data-solid', progress < SOLID);

    // It turns about its own middle, as it lies, and half its thickness back: the
    // way its cover opens. Going across the window it banks: the edge that leads
    // is the further away.
    const turn = angle() + way.bank * height * (g.dx + scrolled < 0 ? 1 : -1);
    const lean = way.lean * height;
    // Its back is there only while that is the side that shows. Safari, left
    // to hide it as a side facing away, draws it over the cover.
    flyer.toggleAttribute('data-turned', flying && Math.cos((turn * Math.PI) / 180) < 0);
    spinner.style.transformOrigin = `${(g.width / 2 + aside).toFixed(2)}px 50% calc(var(--depth, 0px) / -2)`;
    // What it turns about is half its thickness behind its cover, and is set that far back from
    // the eye's plane, which the cover is then in when it faces the reader: drawn the size it is
    // laid out, as the book it leaves is, and as it is itself once it has landed.
    spinner.style.transform = flying
      ? `perspective(${(g.page * EYE).toFixed(1)}px) translateZ(calc(var(--depth, 0px) / -2)) rotateX(${lean.toFixed(2)}deg) rotateY(${turn.toFixed(2)}deg)`
      : '';

    const dim = inOutSine(clamp((at - way.dims.after) / way.dims.over)).toFixed(3);
    for (const el of faders) el.style.opacity = dim;
  }

  const tick = (now: number) => {
    frame = 0;
    if (!flyer) return;
    geometry ??= measure();
    if (!geometry) {
      // Not laid out yet: the dialog shows its content a moment after it is made.
      frame = requestAnimationFrame(tick);
      return;
    }
    if (heading === 1 && lain < way.waits) {
      lain++;
      draw();
      frame = requestAnimationFrame(tick);
      return;
    }
    // The first frame is where it starts from. A frame that comes late doesn't make the book jump.
    const passed = then === 0 ? 0 : Math.min(50, now - then);
    then = now;

    // However long its leaves were given to turn back, a book that has them all down is ready.
    if (heading === -1 && now < departs && !turning()) departs = now;

    if (still()) at = heading === 1 ? way.flight : 0;
    else if (heading === 1 || now < departs) at = Math.min(way.flight, at + passed);
    else at = Math.max(0, at - passed);

    if (heading === 1 && !opened && at >= way.opens) {
      opened = true;
      openedAt = now;
      options.open();
    }

    if (over && heading === -1 && angle() <= -90) turnOver();
    // Turned back before it came round, it is at rest again as it was, and may be read on.
    if (over && heading === 1 && at >= way.flight) {
      over = false;
      flyer.removeAttribute('data-back');
    }

    const slid = still() ? 1 : clamp((now - slide.at) / SLIDE);
    lying = slide.from + (slide.to - slide.from) * inOutCubic(slid);
    flyer.toggleAttribute('data-sliding', slid < 1);

    draw();
    // It is in view now, where what it leaves is: that can go.
    if (heading === 1) say(true);

    const flying = heading === 1 ? at < way.flight : at > 0;
    if (flying || slid < 1) {
      frame = requestAnimationFrame(tick);
    } else if (heading === -1) {
      // Home: what it left is back, and the dialog has nothing left to wait for.
      say(false);
      hold?.finish();
    }
  };

  function wake() {
    if (frame !== 0 || !flyer) return;
    then = 0;
    frame = requestAnimationFrame(tick);
  }

  /** Says how the book is to lie, starting `wait` ms from now. */
  function lie(to: Lying, wait = 0) {
    if (to === slide.to) return;
    slide = { from: lying, to, at: performance.now() + wait };
    // For the stylesheet, which draws the ring round the book where it lies.
    flyer?.setAttribute('data-lying', LYING[to]);
    flyer?.toggleAttribute('data-sliding', true);
    wake();
  }

  const measureAgain = () => {
    geometry = undefined;
    wake();
  };

  return {
    /** Sends the book out. Called as the dialog opens, and to turn round a book that is going back. */
    out() {
      heading = 1;
      opened = false;
      aim('far', 0);
      wake();
    },

    /**
     * Sends the book back. Call it in the task that closes the dialog, which
     * then keeps its content until the book is home.
     */
    back() {
      heading = -1;
      const now = performance.now();
      const busy = turning();
      // Read to its end, it lies shut with its back cover up, and goes as it is: half a turn brings its front round.
      // Open past its middle, it has fewer leaves to turn to its end than to its start, so it shuts there first.
      const left = end - turned;
      over =
        !still() &&
        !busy &&
        end > 0 &&
        (left === 0 || (options.last !== undefined && turned > end / 2));
      flyer?.toggleAttribute('data-back', over);
      // Back cover up it goes round the other way, as its leaves did to get there, not as a cover shuts.
      aim('near', over ? 180 - 360 * way.turns : 360 * way.turns);
      let count: number;
      if (over) {
        count = left;
        // This says where the book lies next, so what follows has the last word.
        if (left > 0) options.last?.();
        // A single page is never shut at its back, and slides to where a shut book lies as it goes.
        if (columns() === 1) lie(0, lead(count));
      } else {
        count = options.shut();
      }
      // How long its pages have been in the air, if it is still opening.
      const flown = busy && opened ? now - openedAt - BACK.pages : Infinity;
      // A shut book goes at once. An open one first turns its leaves back, and leaves as its cover shuts.
      const wait =
        still() || count === 0 || flown <= 0
          ? 0
          : Math.min(lead(count), flown) + (busy ? BACK.gather : 0);
      departs = now + wait;
      // What it left may have moved since.
      geometry = undefined;
      if (flyer && !still()) {
        hold?.cancel();
        hold = flyer.animate([{}, {}], {
          duration: Math.max(1, wait + Math.min(way.flight, at + wait)),
        });
      }
      wake();
    },

    /**
     * Says where the book is open now, as `turned` leaves of `count`, so it
     * can be kept in the middle of the window: a shut book takes half the
     * room of an open one.
     */
    turnedTo(next: number, count: number) {
      // One page to a leaf, the last page never turns away: the book is shut only at its front.
      const to: Lying = next === 0 ? 0 : columns() === 1 || next < count ? 1 : 2;
      // A cover shuts after the pages before it have turned back, and opens before them.
      lie(to, to === 1 ? 0 : lead(Math.abs(next - turned)));
      turned = next;
      // A single page has a leaf to itself, and the last one stays where it is.
      end = columns() === 1 ? count - 1 : count;
    },

    /** Takes the box that flies. Inside it are the one that turns round and the book's other sides. */
    bind(el: HTMLElement | null) {
      if (!el) return undefined;
      flyer = el;
      spinner = el.querySelector<HTMLElement>("[data-flight='spinner']") ?? undefined;
      scroller = el.closest<HTMLElement>('[data-slot="book-scroller"]') ?? undefined;
      // A shut book is kept in the middle of the window as what it lies in scrolls.
      scroller?.addEventListener('scroll', wake, { passive: true });
      at = 0;
      lain = 0;
      lying = 0;
      slide = { from: 0, to: 0, at: 0 };
      el.setAttribute('data-lying', LYING[0]);
      turned = 0;
      spin = { far: 0, near: 360 * way.turns };
      over = false;
      geometry = undefined;
      window.addEventListener('resize', measureAgain);
      wake();
      return () => {
        window.removeEventListener('resize', measureAgain);
        scroller?.removeEventListener('scroll', wake);
        cancelAnimationFrame(frame);
        frame = 0;
        hold = undefined;
        flyer = spinner = scroller = undefined;
        say(false);
      };
    },

    /** Takes something that comes and goes with the book. */
    fade(el: HTMLElement | null) {
      if (!el) return undefined;
      faders.add(el);
      return () => {
        faders.delete(el);
      };
    },
  };
}

type Flight = ReturnType<typeof createFlight>;

export { createFlight };
export type { Flight, FlightOptions };
