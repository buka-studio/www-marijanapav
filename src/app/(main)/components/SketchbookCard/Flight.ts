import { clamp, inOutCubic, inOutSine, WAYS, type Way, type WayName } from './ways';

const SOLID = 0.9;
const EYE = 3.2;
const SLIDE = 520;
const BACK = { between: 70, most: 12, cover: 430, pages: 290, gather: 250 };

type Lying = 0 | 1 | 2;
const LYING = ['front', 'open', 'back'] as const;

export interface FlightOptions {
  way?: WayName;
  from(): HTMLElement | null;
  canLeave?(): boolean;
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

function prefersStill() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function timeToTurnBack(leaves: number) {
  return leaves < 2 ? 0 : (Math.min(leaves, BACK.most) - 2) * BACK.between + BACK.cover;
}

export default class Flight {
  private options: FlightOptions;
  private way: Way;

  private flyer?: HTMLElement;
  private spinner?: HTMLElement;
  private scroller?: HTMLElement;
  private faders = new Set<HTMLElement>();

  private frame = 0;
  private lastFrameAt = 0;
  private at = 0;
  private heading: 1 | -1 = -1;
  private opened = false;
  private openedAt = 0;
  private departsAt = 0;
  private away = false;
  private framesLain = 0;
  private geometry?: Geometry;
  private hold?: Animation;

  private lying = 0;
  private slide = { from: 0, to: 0 as Lying, at: 0 };
  private turned = 0;
  private end = 0;

  private spin: { far: number; near: number };
  private backCoverUp = false;

  constructor(options: FlightOptions) {
    this.options = options;
    this.way = WAYS[options.way ?? 'thrown'];
    this.spin = { far: 0, near: 360 * this.way.turns };
  }

  public out() {
    this.heading = 1;
    this.opened = false;
    this.aim('far', 0);
    this.wake();
  }

  public back() {
    const { options, way } = this;
    this.heading = -1;
    const now = performance.now();
    const busy = this.isTurning();
    const left = this.end - this.turned;
    this.backCoverUp =
      !prefersStill() &&
      !busy &&
      this.end > 0 &&
      (left === 0 || (options.last !== undefined && this.turned > this.end / 2));
    this.flyer?.toggleAttribute('data-back', this.backCoverUp);
    this.aim('near', this.backCoverUp ? 180 - 360 * way.turns : 360 * way.turns);

    let count: number;
    if (this.backCoverUp) {
      count = left;
      if (left > 0) options.last?.();
      if (options.columns() === 1) this.lie(0, timeToTurnBack(count));
    } else {
      count = options.shut();
    }

    const flown = busy && this.opened ? now - this.openedAt - BACK.pages : Infinity;
    const wait =
      prefersStill() || count === 0 || flown <= 0
        ? 0
        : Math.min(timeToTurnBack(count), flown) + (busy ? BACK.gather : 0);
    this.departsAt = now + wait;
    this.geometry = undefined;
    if (this.flyer && !prefersStill()) {
      this.hold?.cancel();
      this.hold = this.flyer.animate([{}, {}], {
        duration: Math.max(1, wait + Math.min(way.flight, this.at + wait)),
      });
    }
    this.wake();
  }

  public turnedTo(next: number, count: number) {
    const columns = this.options.columns();
    const to: Lying = next === 0 ? 0 : columns === 1 || next < count ? 1 : 2;
    this.lie(to, to === 1 ? 0 : timeToTurnBack(Math.abs(next - this.turned)));
    this.turned = next;
    this.end = columns === 1 ? count - 1 : count;
  }

  public bind = (el: HTMLElement | null) => {
    if (!el) return undefined;
    this.flyer = el;
    this.spinner = el.querySelector<HTMLElement>("[data-flight='spinner']") ?? undefined;
    this.scroller = el.closest<HTMLElement>('[data-slot="book-scroller"]') ?? undefined;
    this.scroller?.addEventListener('scroll', this.wake, { passive: true });
    this.at = 0;
    this.framesLain = 0;
    this.lying = 0;
    this.slide = { from: 0, to: 0, at: 0 };
    el.setAttribute('data-lying', LYING[0]);
    this.turned = 0;
    this.spin = { far: 0, near: 360 * this.way.turns };
    this.backCoverUp = false;
    this.geometry = undefined;
    window.addEventListener('resize', this.measureAgain);
    this.wake();

    return () => {
      window.removeEventListener('resize', this.measureAgain);
      this.scroller?.removeEventListener('scroll', this.wake);
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.hold = undefined;
      this.flyer = this.spinner = this.scroller = undefined;
      this.say(false);
    };
  };

  public fade = (el: HTMLElement | null) => {
    if (!el) return undefined;
    this.faders.add(el);

    return () => {
      this.faders.delete(el);
    };
  };

  private isTurning() {
    return this.flyer?.querySelector('[data-slot="book"]')?.hasAttribute('data-turning') === true;
  }

  private progress() {
    return clamp(this.at / this.way.flight);
  }

  private angle() {
    const { far, near } = this.spin;

    return far + (near - far) * (1 - this.way.round(this.progress()));
  }

  private aim(end: 'far' | 'near', to: number) {
    const part = 1 - this.way.round(this.progress());
    const now = this.angle();
    const { far, near } = this.spin;
    if (end === 'far') {
      this.spin = { far: to, near: part > 0 ? to + (now - to) / part : to + near - far };
    } else {
      this.spin = { far: part < 1 ? (now - to * part) / (1 - part) : 0, near: to };
    }
  }

  private turnFrontCoverUp() {
    this.backCoverUp = false;
    this.flyer?.removeAttribute('data-back');
    this.spin = { far: this.spin.far - 180, near: this.spin.near - 180 };
    if (this.slide.to === 2) {
      this.slide = { from: 2 - this.slide.from, to: 0, at: this.slide.at };
      this.flyer?.setAttribute('data-lying', LYING[0]);
    }
    this.turned = 0;
    this.options.front();
  }

  private say(away: boolean) {
    if (this.away === away) return;
    this.away = away;
    this.options.away?.(away);
  }

  private measure(): Geometry | undefined {
    const { flyer, spinner, way, options } = this;
    if (!flyer || !spinner) return undefined;
    flyer.style.transform = spinner.style.transform = 'none';
    const box = spinner.getBoundingClientRect();
    if (box.width === 0) return undefined;
    const from = options.from()?.getBoundingClientRect();
    const page = box.width / options.columns();
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
      scrolled: this.scroller?.scrollLeft ?? 0,
    };
  }

  private draw() {
    const { flyer, spinner, geometry: g, way, lying } = this;
    if (!flyer || !spinner || !g) return;
    const progress = this.progress();
    const gone = way.ease(progress);
    const flying = progress < 1;
    const height = Math.sin(Math.PI * gone);

    const scale = g.small + (1 - g.small) * gone;
    const aside = ((g.width - g.page) / 2) * (1 - lying);
    const scrolled = (this.scroller?.scrollLeft ?? 0) - g.scrolled;
    const x =
      (g.dx + scrolled) * (1 - gone) -
      aside * scale -
      (g.off - scrolled) * gone * Math.abs(1 - lying);
    const y = g.dy * (1 - gone) - way.rise * g.height * height;
    const moved = flying || Math.abs(x) > 0.01;
    flyer.style.transform = moved
      ? `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`
      : '';
    flyer.style.opacity = way.shows === 0 ? '1' : clamp(this.at / way.shows).toFixed(3);
    flyer.toggleAttribute('data-flying', flying);
    flyer.toggleAttribute('data-solid', progress < SOLID);

    const turn = this.angle() + way.bank * height * (g.dx + scrolled < 0 ? 1 : -1);
    const lean = way.lean * height;
    flyer.toggleAttribute('data-turned', flying && Math.cos((turn * Math.PI) / 180) < 0);
    spinner.style.transformOrigin = `${(g.width / 2 + aside).toFixed(2)}px 50% calc(var(--depth, 0px) / -2)`;
    spinner.style.transform = flying
      ? `perspective(${(g.page * EYE).toFixed(1)}px) translateZ(calc(var(--depth, 0px) / -2)) rotateX(${lean.toFixed(2)}deg) rotateY(${turn.toFixed(2)}deg)`
      : '';

    const dim = inOutSine(clamp((this.at - way.dims.after) / way.dims.over)).toFixed(3);
    for (const el of this.faders) el.style.opacity = dim;
  }

  private tick = (now: number) => {
    const { flyer, way, options } = this;
    this.frame = 0;
    if (!flyer) return;

    const leaving = this.heading === 1;
    const waitingToLeave = leaving && this.framesLain === 0 && options.canLeave?.() === false;
    if (waitingToLeave) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    this.geometry ??= this.measure();
    if (!this.geometry) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    if (leaving && this.framesLain < way.waits) {
      this.framesLain++;
      this.draw();
      this.frame = requestAnimationFrame(this.tick);
      return;
    }

    const passed = this.lastFrameAt === 0 ? 0 : Math.min(50, now - this.lastFrameAt);
    this.lastFrameAt = now;

    if (!leaving && now < this.departsAt && !this.isTurning()) this.departsAt = now;

    if (prefersStill()) this.at = leaving ? way.flight : 0;
    else if (leaving || now < this.departsAt) this.at = Math.min(way.flight, this.at + passed);
    else this.at = Math.max(0, this.at - passed);

    if (leaving && !this.opened && this.at >= way.opens) {
      this.opened = true;
      this.openedAt = now;
      options.open();
    }

    if (this.backCoverUp && !leaving && this.angle() <= -90) this.turnFrontCoverUp();
    if (this.backCoverUp && leaving && this.at >= way.flight) {
      this.backCoverUp = false;
      flyer.removeAttribute('data-back');
    }

    const slid = prefersStill() ? 1 : clamp((now - this.slide.at) / SLIDE);
    this.lying = this.slide.from + (this.slide.to - this.slide.from) * inOutCubic(slid);
    flyer.toggleAttribute('data-sliding', slid < 1);

    this.draw();
    if (leaving) this.say(true);

    const flying = leaving ? this.at < way.flight : this.at > 0;
    if (flying || slid < 1) {
      this.frame = requestAnimationFrame(this.tick);
    } else if (!leaving) {
      this.say(false);
      this.hold?.finish();
    }
  };

  private wake = () => {
    if (this.frame !== 0 || !this.flyer) return;
    this.lastFrameAt = 0;
    this.frame = requestAnimationFrame(this.tick);
  };

  private lie(to: Lying, wait = 0) {
    if (to === this.slide.to) return;
    this.slide = { from: this.lying, to, at: performance.now() + wait };
    this.flyer?.setAttribute('data-lying', LYING[to]);
    this.flyer?.toggleAttribute('data-sliding', true);
    this.wake();
  }

  private measureAgain = () => {
    this.geometry = undefined;
    this.wake();
  };
}
