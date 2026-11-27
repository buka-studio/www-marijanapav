import type { Columns, Point, Turns } from '../core';

/** What the book's parts share: the mounted pages and the leaves that turn. */
interface Scene {
  /** The element the pages sit and turn in, once mounted. */
  el: HTMLElement | undefined;
  /** The paper of each mounted page, by its place, counted from 0. */
  papers: Map<number, HTMLElement>;
  /** The leaves. They exist once the pages are mounted. */
  turns: Turns | undefined;
  /** Page height over page width. */
  aspect: number;
  /** Laid-out width of the pages' element in px, as last measured: nothing reads layout while a frame is drawn. */
  across: number;
  /** How much of the turned leaves shows left of a single page, in page widths, as the stylesheet says. */
  verso: number;
}

function createScene(): Scene {
  return { el: undefined, papers: new Map(), turns: undefined, aspect: 1.4, across: 0, verso: 0 };
}

/** Where a pointer is, in page widths from the top of the spine. */
function locate(scene: Scene, columns: Columns, event: PointerEvent): Point {
  const rect = scene.el!.getBoundingClientRect();
  const width = rect.width / columns;
  return {
    x: (event.clientX - rect.left - (columns === 2 ? width : 0)) / width,
    y: (event.clientY - rect.top) / width,
  };
}

function reducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

declare const process: { env: { NODE_ENV?: string } } | undefined;

/** Whether this build reports misuse. A bundler inlines the answer. */
function development() {
  return typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
}

export { createScene, development, locate, reducedMotion };
export type { Scene };
