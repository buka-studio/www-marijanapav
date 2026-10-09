import type { MouseEvent, PointerEvent } from 'react';

import { clamp, degToRad, lerp, radToDeg, randInt, rotate2d, sampleStops, velocityFromSamples } from '~/src/math';

type Placement = {
  x: number;
  y: number;
  rotate: number;
};

type Focus = Placement & {
  scale: number;
};

type PointerSample = { t: number; x: number; y: number };

type DragSession = {
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  poseX: number;
  poseY: number;
  moved: boolean;
  samples: PointerSample[];
};

const MOUSE_SLOP_PX = 12;
const TOUCH_SLOP_PX = 24;
const PLACE_MS = 900;
export const FOCUS_MS = 900;
const FOCUS_MIN_MS = 64;
const FOCUS_IDLE_PX = 0.5;
const FOCUS_ROTATE_PX = 2;
const FOCUS_SCALE_PX = 240;
const SPREAD_ROTATE_DEG = 35;
const POINTER_SAMPLE_WINDOW_MS = 100;
const POINTER_SAMPLE_MAX = 8;
const INERTIA_POWER = 0.26;
const INERTIA_TIME_CONSTANT = 380;
const INERTIA_REST_DELTA = 1;
const INERTIA_REST_SPEED = 10;
const SUPPRESS_CLICK_MS = 50;
const REST_FOCUS: Focus = { x: 0, y: 0, rotate: 0, scale: 1 };
const DRAG_CURSOR_CLASS = 'is-stamp-dragging';

let dragCursorOverlay: HTMLDivElement | null = null;

function setStampDragCursor(active: boolean) {
  document.documentElement.classList.toggle(DRAG_CURSOR_CLASS, active);
  if (active) {
    window.getSelection()?.removeAllRanges();
  }

  if (!active) {
    dragCursorOverlay?.remove();
    return;
  }

  if (!dragCursorOverlay) {
    dragCursorOverlay = document.createElement('div');
    dragCursorOverlay.setAttribute('aria-hidden', 'true');
    dragCursorOverlay.setAttribute('data-slot', 'stamp-drag-cursor');
  }

  document.documentElement.appendChild(dragCursorOverlay);
}

const SPRING_STOPS = [
  0, 0.2266, 0.4544, 0.6162, 0.7301, 0.8102, 0.8665, 0.9061, 0.934, 0.9536, 0.9673, 0.977, 0.9838,
  0.9886, 0.992, 0.9944, 0.996, 0.9972, 0.998, 0.9986, 1,
];
const SPRING_EASE = `linear(${SPRING_STOPS.join(', ')})`;
const INERTIA_BOUNCE_EASE = 'cubic-bezier(0.22, 1.35, 0.36, 1)';

function inertiaDurationMs(amplitude: number) {
  const amp = Math.max(Math.abs(amplitude), INERTIA_REST_DELTA);
  return Math.round(INERTIA_TIME_CONSTANT * Math.log(amp / INERTIA_REST_DELTA));
}

function inertiaEase(amplitude: number) {
  const k = Math.log(Math.max(Math.abs(amplitude), INERTIA_REST_DELTA) / INERTIA_REST_DELTA);
  if (k === 0) {
    return 'linear(0, 1)';
  }
  const stops: number[] = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    stops.push((1 - Math.exp(-u * k)) / (1 - Math.exp(-k)));
  }
  return `linear(${stops.join(', ')})`;
}

function lerpFocus(from: Focus, to: Focus, t: number): Focus {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    rotate: lerp(from.rotate, to.rotate, t),
    scale: lerp(from.scale, to.scale, t),
  };
}

function focusDistance(from: Focus, to: Focus) {
  return (
    Math.hypot(to.x - from.x, to.y - from.y) +
    Math.abs(to.rotate - from.rotate) * FOCUS_ROTATE_PX +
    Math.abs(to.scale - from.scale) * FOCUS_SCALE_PX
  );
}

function focusDurationMs(from: Focus, to: Focus, fullFocus: Focus) {
  const distance = focusDistance(from, to);
  if (distance < FOCUS_IDLE_PX) {
    return 0;
  }
  const full = Math.max(focusDistance(REST_FOCUS, fullFocus), distance, 1);
  return Math.round(clamp(FOCUS_MIN_MS, FOCUS_MS, FOCUS_MS * (distance / full)));
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function placementTransform(pose: Placement) {
  return `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotate}deg)`;
}

function focusTransform(pose: Focus) {
  return `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotate}deg) scale(${pose.scale})`;
}

function getTransformFromElement(el: HTMLElement) {
  const raw = getComputedStyle(el).transform;
  if (!raw || raw === 'none') {
    return { x: 0, y: 0, rotate: 0, scale: 1 };
  }
  const m = new DOMMatrixReadOnly(raw);
  return {
    x: m.e,
    y: m.f,
    rotate: radToDeg(Math.atan2(m.b, m.a)),
    scale: Math.hypot(m.a, m.b) || 1,
  };
}

function stopAnimations(el: HTMLElement) {
  for (const animation of el.getAnimations()) {
    try {
      animation.commitStyles();
    } catch {}
    animation.cancel();
  }
}

function runningDurationMs(animation: Animation) {
  const effect = animation.effect;
  if (effect && 'getComputedTiming' in effect) {
    const duration = effect.getComputedTiming().duration;
    if (typeof duration === 'number' && duration > 0) {
      return duration;
    }
  }
  return FOCUS_MS;
}

function isRunning(animation: Animation | null): animation is Animation {
  return Boolean(animation && (animation.playState === 'running' || animation.pending));
}

function getRelativeBox(container: HTMLElement, parent: HTMLElement) {
  const box = container.getBoundingClientRect();
  const origin = parent.getBoundingClientRect();
  return {
    x: box.left - origin.left,
    y: box.top - origin.top,
    width: box.width,
    height: box.height,
  };
}

function clampToConstraints(
  pose: { x: number; y: number },
  placementEl: HTMLElement,
  parent: HTMLElement,
  constraints: HTMLElement,
) {
  const box = getRelativeBox(constraints, parent);
  const minX = box.x;
  const maxX = box.x + box.width - placementEl.offsetWidth;
  const minY = box.y;
  const maxY = box.y + box.height - placementEl.offsetHeight;
  return {
    x: clamp(Math.min(minX, maxX), Math.max(minX, maxX), pose.x),
    y: clamp(Math.min(minY, maxY), Math.max(minY, maxY), pose.y),
  };
}

function getOffsetParent(el: HTMLElement) {
  const parent = el.offsetParent ?? el.parentElement;
  return parent instanceof HTMLElement ? parent : null;
}

function isTouchPointer(pointerType: string) {
  return pointerType === 'touch' || pointerType === 'pen';
}

function getDragSlop(pointerType: string) {
  return isTouchPointer(pointerType) ? TOUCH_SLOP_PX : MOUSE_SLOP_PX;
}

function recordPointer(samples: PointerSample[], event: { clientX: number; clientY: number }) {
  const next = { t: performance.now(), x: event.clientX, y: event.clientY };
  samples.push(next);
  const cutoff = next.t - POINTER_SAMPLE_WINDOW_MS;
  while (samples.length > POINTER_SAMPLE_MAX || (samples[0] && samples[0].t < cutoff)) {
    if (samples.length < 2) {
      break;
    }
    samples.shift();
  }
}

export default class StampMotionController {
  id?: string;
  index?: number;
  dragDisabled = false;
  placementEl: HTMLElement | null = null;
  focusEl: HTMLElement | null = null;
  onDragStart?: (event: PointerEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: PointerEvent<HTMLDivElement>) => void;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;

  #placement: Placement = { x: 0, y: 0, rotate: 0 };
  #focused = false;
  #placementAnimation: Animation | null = null;
  #placementTarget: Placement | null = null;
  #focusAnimation: Animation | null = null;
  #focusCompleteCallbacks = new Set<() => void>();
  #focusFrom: Focus = { ...REST_FOCUS };
  #focusTo: Focus = { ...REST_FOCUS };
  #fullFocus: Focus = { ...REST_FOCUS };
  #drag: DragSession | null = null;
  #ignoreClick = false;
  #ignoreClickTimer = 0;

  attachPlacementEl(node: HTMLElement | null) {
    this.placementEl = node;
  }

  attachFocusEl(node: HTMLElement | null) {
    this.focusEl = node;
  }

  onFocusComplete(callback: () => void) {
    if (this.#focused && !this.#focusAnimation) {
      callback();
    } else {
      this.#focusCompleteCallbacks.add(callback);
    }
    return () => {
      this.#focusCompleteCallbacks.delete(callback);
    };
  }

  focusInContainer(container: HTMLElement, scale = 1.5, animate = true) {
    const placementEl = this.placementEl;
    const focusEl = this.focusEl;
    if (!placementEl || !focusEl) {
      return;
    }

    this.#showOnBoard();
    this.#placement = this.#stopPlacementAndRead();

    const stamp = placementEl.getBoundingClientRect();
    const box = container.getBoundingClientRect();
    const local = rotate2d(
      box.left + box.width / 2 - (stamp.left + stamp.width / 2),
      box.top + box.height / 2 - (stamp.top + stamp.height / 2),
      -degToRad(this.#placement.rotate),
    );

    this.#focused = true;
    this.#animateFocusTo({ x: local.x, y: local.y, rotate: -this.#placement.rotate, scale }, animate);
  }

  unfocus(animate = true) {
    if (!this.#focused) {
      return;
    }
    this.#focused = false;
    if (animate) {
      this.#animateFocusTo(REST_FOCUS, true);
      return;
    }
    this.#setFocus(REST_FOCUS);
  }

  spreadOut({
    container,
    dist,
    rotate: nextRotate,
    padding = 0,
    delay = 0,
  }: {
    container: HTMLElement;
    dist: number;
    rotate?: number;
    padding?: number;
    delay?: number;
  }) {
    const placementEl = this.placementEl;
    if (!placementEl) {
      return false;
    }

    const alreadyOnBoard = placementEl.classList.contains('is-placed');
    this.#showOnBoard();
    const parent = getOffsetParent(placementEl);
    if (!parent) {
      return false;
    }

    const width = placementEl.offsetWidth;
    const height = placementEl.offsetHeight;
    const box = getRelativeBox(container, parent);
    if (box.width < 80 || box.height < 80) {
      return false;
    }
    const cx = box.x + box.width / 2 - width / 2;
    const cy = box.y + box.height / 2 - height / 2;
    const minX = box.x + padding;
    const maxX = box.x + box.width - width - padding;
    const minY = box.y + padding;
    const maxY = box.y + box.height - height - padding;
    const next: Placement = {
      x: clamp(Math.min(minX, maxX), Math.max(minX, maxX), cx + randInt(-dist, dist)),
      y: clamp(Math.min(minY, maxY), Math.max(minY, maxY), cy + randInt(-dist, dist)),
      rotate: nextRotate ?? randInt(-SPREAD_ROTATE_DEG, SPREAD_ROTATE_DEG),
    };

    if (!alreadyOnBoard) {
      this.#setPlacement({ x: cx, y: cy, rotate: this.#placement.rotate });
    }

    this.#animatePlacementTo(next, true, this.#placementAnimation ? 0 : delay);
    return true;
  }

  placeAt(pose: Partial<Placement>) {
    this.#animatePlacementTo(
      {
        x: pose.x ?? this.#placement.x,
        y: pose.y ?? this.#placement.y,
        rotate: pose.rotate ?? this.#placement.rotate,
      },
      true,
    );
    this.#showOnBoard();
  }

  constrainTo(constraints: HTMLElement) {
    const placementEl = this.placementEl;
    const parent = placementEl ? getOffsetParent(placementEl) : null;
    if (!placementEl || !parent || this.#drag) {
      return false;
    }
    if (!placementEl.classList.contains('is-placed')) {
      return false;
    }
    if (constraints.clientWidth < 2 || constraints.clientHeight < 2) {
      return false;
    }

    // Constrain the destination without stopping an animation that still fits.
    const live = this.#placementTarget ?? this.#placement;
    const next = clampToConstraints(live, placementEl, parent, constraints);
    if (next.x === live.x && next.y === live.y) {
      return false;
    }

    if (this.#placementTarget) {
      this.#animatePlacementTo({ ...live, ...next }, true);
    } else {
      this.#setPlacement({ ...live, ...next });
    }
    return true;
  }

  pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (this.dragDisabled || event.button !== 0) {
      return;
    }

    event.preventDefault();
    window.getSelection()?.removeAllRanges();
    this.#drag = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      poseX: this.#placement.x,
      poseY: this.#placement.y,
      moved: false,
      samples: [{ t: performance.now(), x: event.clientX, y: event.clientY }],
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  pointerMove(event: PointerEvent<HTMLDivElement>, constraints: HTMLElement | null) {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < getDragSlop(drag.pointerType)) {
      return;
    }

    if (!drag.moved) {
      const live = this.#stopPlacementAndRead();
      drag.poseX = live.x - dx;
      drag.poseY = live.y - dy;
      drag.moved = true;
      this.#ignoreClick = true;
      this.#setFocus(REST_FOCUS);
      if (drag.pointerType === 'mouse') {
        this.#setDraggingCursor(true);
      }
      this.onDragStart?.(event);
    }

    const placementEl = this.placementEl;
    const parent = placementEl ? getOffsetParent(placementEl) : null;
    let nextX = drag.poseX + dx;
    let nextY = drag.poseY + dy;

    if (placementEl && parent && constraints) {
      const clamped = clampToConstraints({ x: nextX, y: nextY }, placementEl, parent, constraints);
      nextX = clamped.x;
      nextY = clamped.y;
    }

    this.#setPlacement({ ...this.#placement, x: nextX, y: nextY });
    recordPointer(drag.samples, event);
  }

  pointerUp(event: PointerEvent<HTMLDivElement>, constraints: HTMLElement | null) {
    const drag = this.#drag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    this.#drag = null;
    this.#setDraggingCursor(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (event.type === 'pointercancel') {
      this.#suppressNextClick();
      if (drag.moved) {
        this.onDragEnd?.(event);
      }
      return;
    }

    if (drag.moved) {
      this.#suppressNextClick();
      if (!prefersReducedMotion()) {
        this.#applyInertia(event, drag, constraints);
      }
      this.onDragEnd?.(event);
      return;
    }

    this.onClick?.(event as unknown as MouseEvent<HTMLDivElement>);
    this.#suppressNextClick();
  }

  click(event: MouseEvent<HTMLDivElement>) {
    if (this.#ignoreClick) {
      this.#ignoreClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.onClick?.(event);
  }

  dispose() {
    this.#focusCompleteCallbacks.clear();
    window.clearTimeout(this.#ignoreClickTimer);
    this.#placementAnimation?.cancel();
    this.#focusAnimation?.cancel();
    this.#placementAnimation = null;
    this.#placementTarget = null;
    this.#focusAnimation = null;
    this.#drag = null;
    this.#setDraggingCursor(false);
  }

  #setDraggingCursor(active: boolean) {
    this.placementEl?.toggleAttribute('data-dragging', active);
    setStampDragCursor(active);
  }

  #showOnBoard() {
    this.placementEl?.classList.add('is-placed');
  }

  #setFocusAnimating(animating: boolean) {
    const willChange = animating ? 'transform' : '';
    this.placementEl?.classList.toggle('is-select-moving', animating);
    if (this.placementEl) {
      this.placementEl.style.willChange = willChange;
    }
    if (this.focusEl) {
      this.focusEl.style.willChange = willChange;
    }
  }

  #focusNow(): Focus {
    const animation = this.#focusAnimation;
    if (isRunning(animation) && typeof animation.currentTime === 'number') {
      const t = clamp(0, 1, animation.currentTime / runningDurationMs(animation));
      return lerpFocus(this.#focusFrom, this.#focusTo, sampleStops(SPRING_STOPS, t));
    }
    return this.focusEl ? getTransformFromElement(this.focusEl) : { ...REST_FOCUS };
  }

  #setPlacement(pose: Placement) {
    const el = this.placementEl;
    this.#placementAnimation?.cancel();
    this.#placementAnimation = null;
    this.#placementTarget = null;
    this.#placement = pose;
    if (el) {
      stopAnimations(el);
      el.style.transform = placementTransform(pose);
    }
  }

  #setFocus(pose: Focus) {
    const el = this.focusEl;
    this.#focusAnimation?.cancel();
    this.#focusAnimation = null;
    this.#focusFrom = pose;
    this.#focusTo = pose;
    this.#focused = pose.scale !== 1 || pose.x !== 0 || pose.y !== 0 || pose.rotate !== 0;
    this.#setFocusAnimating(false);
    if (el) {
      stopAnimations(el);
      el.style.transform = focusTransform(pose);
    }
    if (this.#focused) {
      const callbacks = [...this.#focusCompleteCallbacks];
      this.#focusCompleteCallbacks.clear();
      callbacks.forEach((callback) => callback());
    }
  }

  #stopPlacementAndRead(): Placement {
    const el = this.placementEl;
    if (!el) {
      return this.#placement;
    }
    this.#placementAnimation = null;
    this.#placementTarget = null;
    stopAnimations(el);
    const { x, y, rotate } = getTransformFromElement(el);
    const pose = { x, y, rotate };
    el.style.transform = placementTransform(pose);
    this.#placement = pose;
    return pose;
  }

  #afterCurrentAnimation(animation: Animation, isCurrent: () => boolean, apply: () => void) {
    animation.finished
      .then(() => {
        if (!isCurrent()) {
          return;
        }
        apply();
      })
      .catch(() => {});
  }

  #animateFocusTo(pose: Focus, animate: boolean) {
    const el = this.focusEl;
    if (!el) {
      return;
    }

    const from = this.#focusNow();
    this.#focusAnimation?.cancel();
    this.#focusAnimation = null;
    el.style.transform = focusTransform(from);

    const isRest = pose.scale === 1 && pose.x === 0 && pose.y === 0 && pose.rotate === 0;
    if (!isRest) {
      this.#fullFocus = pose;
    }
    this.#focusFrom = from;
    this.#focusTo = pose;

    if (!animate || prefersReducedMotion()) {
      this.#setFocus(pose);
      return;
    }

    const duration = focusDurationMs(from, pose, this.#fullFocus);
    if (duration === 0) {
      this.#setFocus(pose);
      return;
    }

    this.#setFocusAnimating(true);
    const animation = el.animate(
      [{ transform: focusTransform(from) }, { transform: focusTransform(pose) }],
      { duration, easing: SPRING_EASE, fill: 'forwards' },
    );
    this.#focusAnimation = animation;
    this.#afterCurrentAnimation(animation, () => this.#focusAnimation === animation, () =>
      this.#setFocus(pose),
    );
  }

  #animatePlacementTo(
    pose: Placement,
    animate: boolean,
    delay = 0,
    motion: { duration?: number; easing?: string } = {},
  ) {
    const el = this.placementEl;
    if (!el) {
      this.#placement = pose;
      return;
    }

    const from = this.#stopPlacementAndRead();
    this.#placement = from;

    if (!animate || prefersReducedMotion()) {
      this.#setPlacement(pose);
      return;
    }

    const animation = el.animate(
      [{ transform: placementTransform(from) }, { transform: placementTransform(pose) }],
      {
        duration: motion.duration ?? PLACE_MS,
        delay,
        easing: motion.easing ?? SPRING_EASE,
        fill: 'forwards',
      },
    );
    this.#placementAnimation = animation;
    this.#placementTarget = pose;
    this.#afterCurrentAnimation(animation, () => this.#placementAnimation === animation, () =>
      this.#setPlacement(pose),
    );
  }

  #suppressNextClick() {
    this.#ignoreClick = true;
    window.clearTimeout(this.#ignoreClickTimer);
    this.#ignoreClickTimer = window.setTimeout(() => {
      this.#ignoreClick = false;
    }, SUPPRESS_CLICK_MS);
  }

  #applyInertia(
    event: PointerEvent<HTMLDivElement>,
    drag: DragSession,
    constraints: HTMLElement | null,
  ) {
    recordPointer(drag.samples, event);
    const { vx, vy } = velocityFromSamples(drag.samples, { windowMs: 100, minDt: 12 });
    const speed = Math.hypot(vx, vy) * 1000;
    if (speed < INERTIA_REST_SPEED) {
      return;
    }

    const from = this.#placement;
    let nextX = from.x + vx * 1000 * INERTIA_POWER;
    let nextY = from.y + vy * 1000 * INERTIA_POWER;
    const placementEl = this.placementEl;
    const parent = placementEl ? getOffsetParent(placementEl) : null;
    let bounced = false;

    if (placementEl && parent && constraints) {
      const clamped = clampToConstraints({ x: nextX, y: nextY }, placementEl, parent, constraints);
      bounced = clamped.x !== nextX || clamped.y !== nextY;
      nextX = clamped.x;
      nextY = clamped.y;
    }

    const amplitude = Math.hypot(nextX - from.x, nextY - from.y);
    if (amplitude < INERTIA_REST_DELTA) {
      return;
    }

    this.#animatePlacementTo({ ...from, x: nextX, y: nextY }, true, 0, {
      duration: inertiaDurationMs(amplitude),
      easing: bounced ? INERTIA_BOUNCE_EASE : inertiaEase(amplitude),
    });
  }
}
