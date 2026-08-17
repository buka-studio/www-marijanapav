import 'react';

export {};

declare global {
  interface ElementImage {
    readonly width: number;
    readonly height: number;
    close(): void;
  }

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

  interface WebGLCopyElementImageConfig {
    sx?: number;
    sy?: number;
    swidth?: number;
    sheight?: number;
    width?: number;
    height?: number;
  }

  interface WebGLRenderingContext {
    // Chrome 150+: https://github.com/WICG/html-in-canvas/issues/132
    texElementImage2D(
      target: number,
      internalformat: number,
      element: Element | ElementImage,
      config?: WebGLCopyElementImageConfig,
    ): void;
    // Chrome < 150 (texImage2D-shaped signature)
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
