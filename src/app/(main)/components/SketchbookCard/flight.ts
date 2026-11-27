const clamp = (value: number) => Math.min(1, Math.max(0, value));
const outCubic = (t: number) => 1 - (1 - t) ** 3;
const outQuart = (t: number) => 1 - (1 - t) ** 4;
const inOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const inOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

interface Way {
  flight: number;
  opens: number;
  shows: number;
  waits: number;
  dims: { after: number; over: number };
  ease: (t: number) => number;
  round: (t: number) => number;
  turns: number;
  lean: number;
  bank: number;
  rise: number;
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
    round: (t) => inOutCubic(clamp(t / 0.68)),
    turns: 1,
    lean: 8,
    bank: 0,
    rise: 0.05,
    small: { tall: 1, most: 1 },
  },
} satisfies Record<string, Way>;

const SOLID = 0.9;
const EYE = 3.2;
const SLIDE = 520;
const BACK = { between: 70, most: 12, cover: 430, pages: 290, gather: 250 };

type Lying = 0 | 1 | 2;
const LYING = ['front', 'open', 'back'] as const;

interface FlightOptions {
  way?: keyof typeof WAYS;
  from(): HTMLElement | null;
  open(): void;
  shut(): number;
  last?(): void;
  front(): void;
  columns(): 1 | 2;
  away?(away: boolean): void;
}

interface Geometry {
  width: number;
  height: number;
  page: number;
  dx: number;
  dy: number;
  off: number;
  small: number;
  scrolled: number;
}

function still() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function lead(leaves: number) {
  return leaves < 2 ? 0 : (Math.min(leaves, BACK.most) - 2) * BACK.between + BACK.cover;
}

function createFlight(options: FlightOptions) {
  const way: Way = WAYS[options.way ?? 'thrown'];

  let flyer: HTMLElement | undefined;
  let spinner: HTMLElement | undefined;
  let scroller: HTMLElement | undefined;
  const faders = new Set<HTMLElement>();

  let frame = 0;
  let then = 0;
  let at = 0;
  let heading: 1 | -1 = -1;
  let opened = false;
  let openedAt = 0;
  let departs = 0;
  let away = false;
  let lain = 0;
  let geometry: Geometry | undefined;
  let hold: Animation | undefined;

  let lying = 0;
  let slide = { from: 0, to: 0 as Lying, at: 0 };
  let turned = 0;
  let end = 0;

  let spin = { far: 0, near: 360 * way.turns };
  let over = false;

  const turning = () =>
    flyer?.querySelector('[data-slot="book"]')?.hasAttribute('data-turning') === true;
  const { columns } = options;

  const angle = () => spin.far + (spin.near - spin.far) * (1 - way.round(clamp(at / way.flight)));

  function aim(end: 'far' | 'near', to: number) {
    const part = 1 - way.round(clamp(at / way.flight));
    const now = angle();
    if (end === 'far')
      spin = { far: to, near: part > 0 ? to + (now - to) / part : to + spin.near - spin.far };
    else spin = { far: part < 1 ? (now - to * part) / (1 - part) : 0, near: to };
  }

  function turnOver() {
    over = false;
    flyer?.removeAttribute('data-back');
    spin = { far: spin.far - 180, near: spin.near - 180 };
    if (slide.to === 2) {
      slide = { from: 2 - slide.from, to: 0, at: slide.at };
      flyer?.setAttribute('data-lying', LYING[0]);
    }
    turned = 0;
    options.front();
  }

  function say(now: boolean) {
    if (away === now) return;
    away = now;
    options.away?.(now);
  }

  function measure(): Geometry | undefined {
    if (!flyer || !spinner) return undefined;
    flyer.style.transform = spinner.style.transform = 'none';
    const box = spinner.getBoundingClientRect();
    if (box.width === 0) return undefined;
    const from = options.from()?.getBoundingClientRect();
    const page = box.width / columns();
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

  function draw() {
    const g = geometry;
    if (!flyer || !spinner || !g) return;
    const progress = clamp(at / way.flight);
    const gone = way.ease(progress);
    const flying = progress < 1;
    const height = Math.sin(Math.PI * gone);

    const scale = g.small + (1 - g.small) * gone;
    const aside = ((g.width - g.page) / 2) * (1 - lying);
    const scrolled = (scroller?.scrollLeft ?? 0) - g.scrolled;
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
    flyer.toggleAttribute('data-solid', progress < SOLID);

    const turn = angle() + way.bank * height * (g.dx + scrolled < 0 ? 1 : -1);
    const lean = way.lean * height;
    flyer.toggleAttribute('data-turned', flying && Math.cos((turn * Math.PI) / 180) < 0);
    spinner.style.transformOrigin = `${(g.width / 2 + aside).toFixed(2)}px 50% calc(var(--depth, 0px) / -2)`;
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
      frame = requestAnimationFrame(tick);
      return;
    }
    if (heading === 1 && lain < way.waits) {
      lain++;
      draw();
      frame = requestAnimationFrame(tick);
      return;
    }
    const passed = then === 0 ? 0 : Math.min(50, now - then);
    then = now;

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
    if (over && heading === 1 && at >= way.flight) {
      over = false;
      flyer.removeAttribute('data-back');
    }

    const slid = still() ? 1 : clamp((now - slide.at) / SLIDE);
    lying = slide.from + (slide.to - slide.from) * inOutCubic(slid);
    flyer.toggleAttribute('data-sliding', slid < 1);

    draw();
    if (heading === 1) say(true);

    const flying = heading === 1 ? at < way.flight : at > 0;
    if (flying || slid < 1) {
      frame = requestAnimationFrame(tick);
    } else if (heading === -1) {
      say(false);
      hold?.finish();
    }
  };

  function wake() {
    if (frame !== 0 || !flyer) return;
    then = 0;
    frame = requestAnimationFrame(tick);
  }

  function lie(to: Lying, wait = 0) {
    if (to === slide.to) return;
    slide = { from: lying, to, at: performance.now() + wait };
    flyer?.setAttribute('data-lying', LYING[to]);
    flyer?.toggleAttribute('data-sliding', true);
    wake();
  }

  const measureAgain = () => {
    geometry = undefined;
    wake();
  };

  return {
    out() {
      heading = 1;
      opened = false;
      aim('far', 0);
      wake();
    },

    back() {
      heading = -1;
      const now = performance.now();
      const busy = turning();
      const left = end - turned;
      over =
        !still() &&
        !busy &&
        end > 0 &&
        (left === 0 || (options.last !== undefined && turned > end / 2));
      flyer?.toggleAttribute('data-back', over);
      aim('near', over ? 180 - 360 * way.turns : 360 * way.turns);
      let count: number;
      if (over) {
        count = left;
        if (left > 0) options.last?.();
        if (columns() === 1) lie(0, lead(count));
      } else {
        count = options.shut();
      }
      const flown = busy && opened ? now - openedAt - BACK.pages : Infinity;
      const wait =
        still() || count === 0 || flown <= 0
          ? 0
          : Math.min(lead(count), flown) + (busy ? BACK.gather : 0);
      departs = now + wait;
      geometry = undefined;
      if (flyer && !still()) {
        hold?.cancel();
        hold = flyer.animate([{}, {}], {
          duration: Math.max(1, wait + Math.min(way.flight, at + wait)),
        });
      }
      wake();
    },

    turnedTo(next: number, count: number) {
      const to: Lying = next === 0 ? 0 : columns() === 1 || next < count ? 1 : 2;
      lie(to, to === 1 ? 0 : lead(Math.abs(next - turned)));
      turned = next;
      end = columns() === 1 ? count - 1 : count;
    },

    bind(el: HTMLElement | null) {
      if (!el) return undefined;
      flyer = el;
      spinner = el.querySelector<HTMLElement>("[data-flight='spinner']") ?? undefined;
      scroller = el.closest<HTMLElement>('[data-slot="book-scroller"]') ?? undefined;
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
