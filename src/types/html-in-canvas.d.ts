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

  // lib.dom models WebGL1 and WebGL2 as sibling interfaces, so this has to
  // be merged onto both. Chrome 150+ signature:
  // https://github.com/WICG/html-in-canvas/issues/132
  interface WebGLTexElementImage2D {
    texElementImage2D(
      target: number,
      internalformat: number,
      element: Element | ElementImage,
      config?: WebGLCopyElementImageConfig,
    ): void;
    texElementImage2D(
      target: number,
      level: number,
      internalformat: number,
      format: number,
      type: number,
      element: Element | ElementImage,
    ): void;
  }

  interface WebGLRenderingContext extends WebGLTexElementImage2D {}
  interface WebGL2RenderingContext extends WebGLTexElementImage2D {}
}

declare module 'react' {
  interface CanvasHTMLAttributes<T> {
    layoutsubtree?: boolean | '';
  }
}
