import { useAnimationFrame } from 'framer-motion';
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';

import { cn } from '~/src/util';

import { MatrixFrameContext } from './MatrixRenderer';

interface Props {
  className?: string;
  cellSize?: number;
  rows?: number;
  onRender: (ctx: MatrixFrameContext) => void;
  onInit?: () => void;
  clear?: 'clear' | 'fade' | 'none';
  fadeAlpha?: number;
  ref?: React.Ref<{
    getFrameContext: () => MatrixFrameContext;
  }>;
}

const DotMatrixDisplay = ({
  className,
  cellSize = 10,
  rows = 8,
  onRender,
  onInit,
  clear = 'none',
  fadeAlpha = 0.1,
  ref,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const frame = useRef<number>(0);
  const frameContextRef = useRef<MatrixFrameContext | null>(null);
  const lastMsRef = useRef<number | null>(null);
  const timeSec = useRef<number>(0);

  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef<number>(1);

  const getCanvasDimensions = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return { rows, cols: 0, widthCss: 0, heightCss: 0 };
    }

    const containerWidthCss = container.clientWidth;
    const calculatedCols = Math.max(1, Math.floor(containerWidthCss / cellSize));

    const widthCss = calculatedCols * cellSize;
    const heightCss = rows * cellSize;

    return {
      rows,
      cols: calculatedCols,
      widthCss,
      heightCss,
    };
  }, [cellSize, rows]);

  useImperativeHandle(ref, () => ({
    getFrameContext: () => {
      return frameContextRef.current!;
    },
  }));

  useLayoutEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctxRef.current = ctx;
    dprRef.current = window.devicePixelRatio || 1;

    const updateCanvasDimensions = () => {
      const currentDpr = dprRef.current;
      const { widthCss, heightCss } = getCanvasDimensions();

      canvas.style.width = `${widthCss}px`;
      canvas.style.height = `${heightCss}px`;

      canvas.width = Math.floor(widthCss * currentDpr);
      canvas.height = Math.floor(heightCss * currentDpr);

      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
    };

    const resizeObserver = new ResizeObserver(updateCanvasDimensions);
    resizeObserver.observe(container);

    updateCanvasDimensions();

    return () => {
      resizeObserver.disconnect();
      ctxRef.current = null;
    };
  }, [cellSize, rows, getCanvasDimensions]);

  const initRef = useRef(false);

  useAnimationFrame((t) => {
    const ctx = ctxRef.current;
    if (!ctx || !onRender) {
      lastMsRef.current = null;
      return;
    }

    if (lastMsRef.current === null) {
      lastMsRef.current = t;
    }

    let deltaMs = t - lastMsRef.current;
    lastMsRef.current = t;

    // cap so we don't jump when tab is unfocused
    if (deltaMs > 100) {
      deltaMs = 100;
    }

    const dtSec = deltaMs / 1000;
    timeSec.current += dtSec;

    const { cols, widthCss, heightCss } = getCanvasDimensions();

    if (clear === 'clear') {
      ctx.clearRect(0, 0, widthCss, heightCss);
    } else if (clear === 'fade') {
      ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      ctx.fillRect(0, 0, widthCss, heightCss);
    }

    const frameCtx: MatrixFrameContext = {
      ctx,
      cols,
      rows,
      cellSize,
      timeSec: timeSec.current,
      dtSec: dtSec,
      frame: frame.current,
      dpr: dprRef.current,
      width: widthCss,
      height: heightCss,
    };

    frameContextRef.current = frameCtx;

    onRender(frameCtx);

    if (!initRef.current) {
      onInit?.();
      initRef.current = true;
    }

    frame.current += 1;
  });

  useEffect(() => {
    return () => {
      lastMsRef.current = null;
      timeSec.current = 0;
      frame.current = 0;
    };
  }, [cellSize, rows, onRender, clear, fadeAlpha]);

  return (
    <div ref={containerRef} className={cn('h-auto w-full', className)}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
};

export default DotMatrixDisplay;
