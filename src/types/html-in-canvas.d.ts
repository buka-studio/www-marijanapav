import 'react';

export {};

declare global {
  interface ElementImage {}

  interface PaintEvent extends Event {
    readonly changedElements: readonly Element[];
  }

  interface HTMLCanvasElement {
    layoutSubtree: boolean;
    onpaint: ((this: HTMLCanvasElement, event: PaintEvent) => void) | null;
    requestPaint(): void;
    captureElementImage(element: Element): ElementImage;
    getElementTransform(element: Element | ElementImage, drawTransform: DOMMatrix): DOMMatrix;
  }

  interface OffscreenCanvas {
    getElementTransform(element: Element | ElementImage, drawTransform: DOMMatrix): DOMMatrix;
  }

  interface CanvasRenderingContext2D {
    drawElementImage(element: Element | ElementImage, dx: number, dy: number): DOMMatrix;
    drawElementImage(
      element: Element | ElementImage,
      dx: number,
      dy: number,
      dWidth: number,
      dHeight: number,
    ): DOMMatrix;
    drawElementImage(
      element: Element | ElementImage,
      sx: number,
      sy: number,
      sWidth: number,
      sHeight: number,
      dx: number,
      dy: number,
    ): DOMMatrix;
    drawElementImage(
      element: Element | ElementImage,
      sx: number,
      sy: number,
      sWidth: number,
      sHeight: number,
      dx: number,
      dy: number,
      dWidth: number,
      dHeight: number,
    ): DOMMatrix;
  }

  interface OffscreenCanvasRenderingContext2D {
    drawElementImage(element: Element | ElementImage, dx: number, dy: number): DOMMatrix;
    drawElementImage(
      element: Element | ElementImage,
      dx: number,
      dy: number,
      dWidth: number,
      dHeight: number,
    ): DOMMatrix;
    drawElementImage(
      element: Element | ElementImage,
      sx: number,
      sy: number,
      sWidth: number,
      sHeight: number,
      dx: number,
      dy: number,
    ): DOMMatrix;
    drawElementImage(
      element: Element | ElementImage,
      sx: number,
      sy: number,
      sWidth: number,
      sHeight: number,
      dx: number,
      dy: number,
      dWidth: number,
      dHeight: number,
    ): DOMMatrix;
  }

  interface WebGLRenderingContext {
    texElementImage2D(
      target: number,
      level: number,
      internalformat: number,
      format: number,
      type: number,
      element: Element | ElementImage,
    ): void;
  }
}

declare module 'react' {
  interface CanvasHTMLAttributes<T> {
    layoutsubtree?: boolean | '';
  }
}
