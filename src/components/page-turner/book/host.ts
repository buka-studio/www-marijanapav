import { facesOf } from '../core';
import { createRenderer, type PageElements } from '../dom';
import type { BookDrawer, BookRenderer } from '../renderer';
import { createTakeover, type Takeover } from '../takeover';
import type { Scene } from './scene';
import type { BookState } from './state';

interface HostOptions {
  scene: Scene;
  state(): BookState;
  hard(leaf: number): boolean;
  refresh(): void;
  still(): void;
  letDown(renderer: BookRenderer): void;
}

const SPARES = '[data-slot="book-page-frame"][data-blank] [data-slot="book-page"]';

function createHost({ scene, state, hard, refresh, still, letDown }: HostOptions) {
  let drawer: BookDrawer | undefined;
  let canvas: { el: HTMLCanvasElement; renderer: BookRenderer } | undefined;
  let kept: Takeover | undefined;
  let takeover: Takeover | undefined;
  const spent = new Set<BookRenderer>();

  const fail = (renderer: BookRenderer) => {
    if (spent.has(renderer)) return;
    spent.add(renderer);
    letDown(renderer);
  };

  const faces = (leaf: number) => facesOf(leaf, state().columns, state().pageCount ?? 0);
  const board = (index: number) => scene.papers.get(index)?.hasAttribute('data-hard') === true;

  const mount = () => {
    drawer?.clear();
    drawer = undefined;
    const pages = scene.el;
    if (!pages) return;
    if (canvas && spent.has(canvas.renderer)) {
    } else if (canvas) {
      const { el, renderer } = canvas;
      const among = renderer.canvas === 'around' ? el : pages;
      try {
        drawer = renderer.create({
          canvas: el,
          pages,
          page: (index) => scene.papers.get(index),
          faces,
          hard,
          board,
          columns: () => state().columns,
          blanks: () => Array.from(among.querySelectorAll<HTMLElement>(`:scope > ${SPARES}`)),
          drawn: () => takeover?.reveal(),
          failed: () => {
            if (canvas?.el === el) fail(renderer);
          },
        });
      } catch (error) {
        console.error(
          `page-turner: the ${renderer.name} renderer couldn't start, so the pages fold.`,
          error,
        );
      }
      if (!drawer) fail(renderer);
    } else {
      drawer = createRenderer({
        page: (index) => elementsOf(scene.papers.get(index)),
        faces,
        columns: () => state().columns,
        verso: () => scene.verso,
        hard,
        blanks: () =>
          Array.from(pages.querySelectorAll<HTMLElement>(`:scope > ${SPARES}`), (paper) =>
            elementsOf(paper)!,
          ),
        strip: () =>
          pages.querySelector<SVGSVGElement>(':scope > [data-slot="book-strip"]') ?? undefined,
      });
    }
    if (!drawer) takeover?.drop();
    refresh();
  };

  const arrive = (el: HTMLElement, copy: Takeover | undefined) => {
    if (takeover !== copy) takeover?.drop();
    takeover = copy;
    copy?.cover(el);
  };

  const coverStrip = () => {
    if (scene.el && canvas?.renderer.canvas === 'over')
      arrive(canvas.el, createTakeover(scene.el, 'strip'));
  };

  return {
    get drawer() {
      return drawer;
    },

    get folding() {
      return canvas === undefined;
    },

    mount,

    forget() {
      if (!canvas) mount();
    },

    uncover() {
      if (takeover?.active) takeover.drop();
    },

    keep() {
      kept = undefined;
      if (!scene.el || canvas) return;
      still();
      kept = createTakeover(scene.el);
    },

    arrived() {
      coverStrip();
      mount();
    },

    left() {
      drawer?.clear();
      takeover?.drop();
      drawer = kept = takeover = undefined;
    },

    bindCanvas(el: HTMLElement, renderer: BookRenderer | undefined) {
      if (!renderer) return;
      canvas = { el: el as HTMLCanvasElement, renderer };
      if (renderer.canvas === 'around') {
        arrive(el, kept ?? (takeover?.active ? takeover : undefined));
        kept = undefined;
      } else {
        coverStrip();
      }
      mount();
      return () => {
        if (canvas?.el !== el) return;
        canvas = undefined;
        mount();
        queueMicrotask(() => {
          if (!canvas) takeover?.drop();
        });
      };
    },
  };
}

const folding = new WeakMap<HTMLElement, PageElements>();

function elementsOf(content: HTMLElement | undefined): PageElements | undefined {
  if (!content) return undefined;
  const known = folding.get(content);
  if (known) return known;
  const clip = content.parentElement;
  const slot = clip?.parentElement;
  if (!clip || !slot || clip.getAttribute('data-slot') !== 'book-page-clip') return undefined;
  const elements = {
    slot,
    clip,
    content,
    shade: content.querySelector<HTMLElement>(':scope > [data-slot="book-page-shade"]')!,
    cast: clip.querySelector<HTMLElement>(':scope > [data-slot="book-page-cast"]')!,
    shadow: clip.querySelector<HTMLElement>('[data-slot="book-page-shadow"]')!,
  };
  folding.set(content, elements);
  return elements;
}

type Host = ReturnType<typeof createHost>;

export { createHost };
export type { Host };
