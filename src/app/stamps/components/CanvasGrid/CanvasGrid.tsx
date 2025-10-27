import { ComponentProps, useLayoutEffect, useRef } from 'react';

import { drawGrid, setupHiDPICtx, type NoiseOpts } from './util';

export type GridCanvasProps = {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  background?: string;
  foreground?: string;
  noise?: NoiseOpts | null;
  align?: 'center' | 'top';
};

export default function GridCanvas({
  width,
  height,
  cellWidth,
  cellHeight,
  background = '#e7e5e4',
  foreground = '#d6d3d1',
  align = 'center',
  ...props
}: GridCanvasProps & ComponentProps<'canvas'>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { ctx, dpr } = setupHiDPICtx(
      canvas,
      width,
      height,
      typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    );

    drawGrid(ctx, {
      width,
      height,
      cellWidth,
      cellHeight,
      background,
      foreground,
      lineWidth: 1,
      align,
    });
  }, [width, height, cellWidth, cellHeight, background, foreground, align]);

  return <canvas ref={canvasRef} {...props} />;
}
