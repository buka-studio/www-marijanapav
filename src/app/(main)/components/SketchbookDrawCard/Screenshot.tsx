'use client';

import { useAnimate } from 'framer-motion';
import { useImperativeHandle, useRef } from 'react';

import { cn } from '~/src/util';

import { getSketchStrokeColor } from './util';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface Dimensions {
  width: number;
  height: number;
}

export interface ScreenshotRef {
  screenshot: (paths: string[], dimensions: Dimensions) => Promise<Blob | null>;
  exit: ({ success }: { success: boolean }) => Promise<void>;
}

interface ScreenshotProps {
  className?: string;
  screenshotRef: React.Ref<ScreenshotRef>;
}

export default function Screenshot({ screenshotRef, className }: ScreenshotProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scope, animate] = useAnimate();

  const cleanupAnimation = async ({ width, height }: Dimensions) => {
    await animate([
      [
        scope.current,
        {
          opacity: 0,
          height,
          width,
          scale: 1,
          y: 0,
          x: 0,
          bottom: 0,
          right: 0,
          filter: 'blur(0px)',
        },
        { duration: 0 },
      ],
      ['canvas', { filter: 'blur(20px)' }, { duration: 0 }],
    ]);
  };

  const runAnimation = async ({ width, height }: Dimensions) => {
    const scale = 0.2;

    const newWidth = width * scale;
    const newHeight = height * scale;

    await animate([
      [scope.current, { opacity: 1 }, { duration: 0 }],
      ['canvas', { filter: 'blur(3px)' }, { duration: 0.4 }],
      [
        scope.current,
        { bottom: 20, right: 20, width: newWidth, height: newHeight },
        {
          duration: 0.3,
          at: '-0.2',
        },
      ],
      ['canvas', { filter: 'blur(0px)' }, { duration: 0.1, at: '-0.1' }],
    ]);
  };

  const shakeAnimation = async (repeat: number) => {
    for (let i = 0; i < repeat; i++) {
      await animate([
        [scope.current, { x: -10 }, { duration: 0.075 }],
        [scope.current, { x: 10 }, { duration: 0.075 }],
      ]);
    }
  };

  const exitAnimation = async ({ success }: { success: boolean }) => {
    if (!success) {
      await shakeAnimation(2);
      await wait(200);
    } else {
      await animate([
        [scope.current, { y: -30, filter: 'blur(2px)' }, { type: 'spring', duration: 0.2 }],
      ]);
    }

    await animate([
      [
        scope.current,
        { opacity: 0, y: 50, scale: 0.75, filter: 'blur(5px)' },
        { type: 'spring', duration: 0.75 },
      ],
    ]);
  };

  useImperativeHandle(screenshotRef, () => ({
    screenshot: async (paths, dimensions) => {
      try {
        await cleanupAnimation(dimensions);

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) {
          console.error('No context found');
          return null;
        }

        canvasRef!.current!.width = dimensions.width;
        canvasRef!.current!.height = dimensions.height;

        ctx.fillStyle = getSketchStrokeColor() || '#000';

        for (const path of paths) {
          const p = new Path2D(path);

          ctx.fill(p);
        }

        await runAnimation(dimensions);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvasRef.current!.toBlob((blob) => {
            resolve(blob);
          });
        });

        await wait(1000);

        return blob;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
    exit: async (props) => {
      await exitAnimation(props);
    },
  }));

  return (
    <div
      className={cn(
        'ss-container border-panel-border pointer-events-none absolute right-0 bottom-0 rounded-lg border bg-white/50 p-1 opacity-0 dark:bg-black/10',
        className,
      )}
      ref={scope}
    >
      <canvas
        ref={canvasRef}
        className="ss-canvas h-full w-full overflow-hidden rounded bg-white blur-lg"
      />
    </div>
  );
}
