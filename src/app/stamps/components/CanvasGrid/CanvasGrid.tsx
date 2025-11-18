import { ComponentProps, useLayoutEffect, useRef } from 'react';

import useResizeRef from '~/src/hooks/useResizeRef';
import { cn } from '~/src/util';

import { drawGrid, setupHiDPICtx, type NoiseOpts } from './util';

export type CanvasGridProps = {
  width?: number;
  height?: number;
  cellWidth: number;
  cellHeight: number;
  background?: string;
  foreground?: string;
  noise?: NoiseOpts | null;
  align?: 'center' | 'top';
};

export default function CanvasGrid({
  width,
  height,
  cellWidth,
  cellHeight,
  background = '#e7e5e4',
  foreground = '#d6d3d1',
  align = 'center',
  ref,
  className,
  ...props
}: CanvasGridProps & ComponentProps<'div'>) {
  const { ref: containerRef, dimensions } = useResizeRef();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const w = width || dimensions.width;
  const h = height || dimensions.height;

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!w || !h) {
      return;
    }

    const { ctx } = setupHiDPICtx(
      canvas,
      w,
      h,
      typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    );

    drawGrid(ctx, {
      width: w,
      height: h,
      cellWidth,
      cellHeight,
      background,
      foreground,
      lineWidth: 1,
      align,
    });
  }, [w, h, cellWidth, cellHeight, background, foreground, align]);

  return (
    <div
      className={cn(
        'transition-opacity',
        {
          'opacity-0': !w || !h,
          'opacity-100': w && h,
        },
        className,
      )}
      ref={(e) => {
        containerRef.current = e;
        if (typeof ref === 'function') {
          ref(e);
        } else if (ref) {
          ref.current = e;
        }
      }}
      {...props}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
