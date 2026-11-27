import type { Columns, Point, Turns } from '../core';

interface Scene {
  el: HTMLElement | undefined;
  papers: Map<number, HTMLElement>;
  turns: Turns | undefined;
  aspect: number;
  across: number;
  verso: number;
}

function createScene(): Scene {
  return { el: undefined, papers: new Map(), turns: undefined, aspect: 1.4, across: 0, verso: 0 };
}

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

function development() {
  return typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
}

export { createScene, development, locate, reducedMotion };
export type { Scene };
