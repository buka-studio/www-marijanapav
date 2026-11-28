import type { Columns, Strip, Turns } from './core';

interface BookRenderer {
  readonly name: string;
  readonly canvas: 'around' | 'over';
  can(): boolean;
  ready(): boolean;
  load(): void;
  watch(listener: () => void): () => void;
  create(host: BookRendererHost): BookDrawer | undefined;
}

interface BookDrawer {
  draw(turns: Turns, h: number, ribbon?: Strip): void;
  clear(): void;
}

interface BookRendererHost {
  canvas: HTMLCanvasElement;
  pages: HTMLElement;
  page(index: number): HTMLElement | undefined;
  faces(leaf: number): { front: number; back: number };
  hard(leaf: number): boolean;
  board(index: number): boolean;
  columns(): Columns;
  blanks(): HTMLElement[];
  drawn(): void;
  failed(): void;
}

function wantedRenderer(
  renderer: BookRenderer | undefined,
  fallback: BookRenderer | undefined,
  letDown: readonly BookRenderer[] = [],
) {
  if (!renderer) return undefined;
  const can = (one: BookRenderer | undefined) =>
    one !== undefined && !letDown.includes(one) && one.can();
  if (can(renderer)) return renderer;
  return can(fallback) ? fallback : undefined;
}

function readyRenderer(
  renderer: BookRenderer | undefined,
  fallback: BookRenderer | undefined,
  letDown: readonly BookRenderer[] = [],
) {
  const wanted = wantedRenderer(renderer, fallback, letDown);
  return wanted?.ready() ? wanted : undefined;
}

export { readyRenderer, wantedRenderer };
export type { BookDrawer, BookRenderer, BookRendererHost };
