import { motion, Point, useAnimation, useDragControls } from 'framer-motion';
import { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import colors from 'tailwindcss/colors';

import useMatchMedia from '~/src/hooks/useMatchMedia';
import { clamp } from '~/src/math';
import { cn } from '~/src/util';

import { Stamp } from '../../../models';
import { useStampStore } from '../../../store';
import { drawGrid, setupHiDPICtx } from '../../CanvasGrid/util';
import Dial from './Dial';
import Lens from './Lens';
import { useLoupeStore } from './store';

const MemoizedLens = memo(Lens);

function getPointerLocalCoords(point: Point, constraint?: HTMLElement | null) {
  if (!constraint) {
    return { x: 0, y: 0 };
  }

  const rect = constraint.getBoundingClientRect();
  return {
    x: point.x - rect.left,
    y: point.y - rect.top,
  };
}

function getPointerOffsetFromElementCenter(point: Point, element?: HTMLElement | null) {
  if (!element) {
    return { x: 0, y: 0 };
  }

  const rect = element.getBoundingClientRect();

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const offsetX = point.x - centerX;
  const offsetY = point.y - centerY;

  return { x: offsetX, y: offsetY };
}

const initial = {
  opacity: 0,
};

function Loupe({
  selectedStamp,
  dragConstraints,
  className,
  baseScale,
  gridCellSize,
  activeStampContainerRef,
}: {
  selectedStamp: Stamp;
  dragConstraints: React.RefObject<HTMLElement | null>;
  className?: string;
  baseScale: number;
  gridCellSize: number;
  activeStampContainerRef: React.RefObject<HTMLElement | null>;
}) {
  const setCoords = useLoupeStore((s) => s.setCoords);
  const setScale = useLoupeStore((s) => s.setScale);
  const scale = useLoupeStore((s) => s.scale);

  const isMobile = useMatchMedia('(max-width: 1024px)');
  const store = useStampStore();

  const lensSize = isMobile ? 135 : 300;
  const dialSize = isMobile ? 190 : 400;

  const magnifierControls = useAnimation();
  const dialDragControls = useDragControls();

  const draggingMagnifier = useRef(false);
  const draggingMagnifierRefOffset = useRef<{ x: number; y: number } | null>({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragConstraints?.current) {
      return;
    }

    if (store.zoomed) {
      setCoords({
        x: dragConstraints.current.offsetWidth / 2,
        y: dragConstraints.current.offsetHeight / 2,
      });

      magnifierControls
        .start({
          x: dragConstraints.current.offsetWidth / 2 - dialSize / 2,
          y: dragConstraints.current.offsetHeight / 2 - dialSize / 2,
          transition: {
            duration: 0,
          },
        })
        .then(() => {
          magnifierControls.start({
            opacity: 1,

            filter: 'blur(0px)',
          });
        });
    } else {
      magnifierControls.start({
        opacity: 0,
        filter: 'blur(10px)',
      });
    }
  }, [store.zoomed, magnifierControls, dragConstraints, setCoords, dialSize]);

  const [canvasData, setCanvasData] = useState<{
    canvas: HTMLCanvasElement;
    cssWidth: number;
    cssHeight: number;
  } | null>(null);

  useEffect(() => {
    const container = dragConstraints.current;
    if (!container) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    const { ctx } = setupHiDPICtx(
      canvas,
      container.offsetWidth,
      container.offsetHeight,
      typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    );
    if (!ctx) {
      return;
    }

    const stampRect = (
      activeStampContainerRef.current || document.querySelector(`[data-id="${selectedStamp.id}"]`)
    )?.getBoundingClientRect();
    if (!stampRect) {
      return;
    }

    drawGrid(ctx, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      align: 'top',
      cellWidth: gridCellSize,
      cellHeight: gridCellSize,
      background: colors.stone[100],
      foreground: colors.stone[300],
      lineWidth: 1,
    });

    const img = new Image();
    img.src = selectedStamp.src; // todo: use srcLg or alt image
    img.onload = () => {
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 20;

      const imgWidth = stampRect.width * baseScale;
      const imgHeight = stampRect.height * baseScale;

      const centerX = container.offsetWidth / 2;
      const centerY = container.offsetHeight / 2;

      ctx.drawImage(img, centerX - imgWidth / 2, centerY - imgHeight / 2, imgWidth, imgHeight);

      setCanvasData({
        canvas,
        cssWidth: container.offsetWidth,
        cssHeight: container.offsetHeight,
      });
    };
  }, [lensSize, selectedStamp, dragConstraints, baseScale, gridCellSize, activeStampContainerRef]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      draggingMagnifier.current = true;
      dialDragControls.start(event);

      // fixes shift from clicks away from the center of the lens
      const draggableCoords = getPointerOffsetFromElementCenter(
        {
          x: event.clientX,
          y: event.clientY,
        },
        event.currentTarget,
      );

      draggingMagnifierRefOffset.current = {
        x: draggableCoords.x,
        y: draggableCoords.y,
      };
    },
    [dialDragControls, draggingMagnifier, draggingMagnifierRefOffset],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const container = dragConstraints.current;
      if (!container) return;

      const localCoords = getPointerLocalCoords(
        {
          x: event.clientX,
          y: event.clientY,
        },
        dragConstraints?.current!,
      );

      if (draggingMagnifier.current && dragConstraints.current) {
        const coords = {
          x: localCoords.x - (draggingMagnifierRefOffset.current?.x ?? 0),
          y: localCoords.y - (draggingMagnifierRefOffset.current?.y ?? 0),
        };

        const radius = dialSize / 2;

        const clampedX = clamp(radius, container.offsetWidth - radius, coords.x);
        const clampedY = clamp(radius, container.offsetHeight - radius, coords.y);

        setCoords({
          x: clampedX,
          y: clampedY,
        });
      }
    },
    [dragConstraints, draggingMagnifier, draggingMagnifierRefOffset, dialSize, setCoords],
  );

  const handlePointerUp = useCallback(() => {
    draggingMagnifier.current = false;
  }, [draggingMagnifier]);

  const style = useMemo(
    () =>
      ({
        '--lens-size': `${lensSize}px`,
        '--dial-size': `${dialSize}px`,
      }) as CSSProperties,
    [lensSize, dialSize],
  );

  return (
    <motion.div
      drag
      data-zoomed={store.zoomed}
      initial={initial}
      dragElastic={0.01}
      dragListener={false}
      dragControls={dialDragControls}
      dragMomentum={false}
      dragConstraints={dragConstraints!}
      animate={magnifierControls}
      style={style}
      className={cn(
        'loupe absolute z-[100] flex aspect-square w-[var(--dial-size)] items-center justify-center rounded-full bg-stone-400 shadow-md shadow-black/30 outline outline-1 outline-[rgba(255,255,255,0.1)] [&[data-zoomed="false"]_.loupe-lens]:!pointer-events-none',
        'shadow-md',
        className,
      )}
    >
      <div
        className={cn(
          'loupe-trigger pointer-events-auto absolute inset-0 left-1/2 top-1/2 z-[100] aspect-square w-[var(--lens-size)] -translate-x-1/2 -translate-y-1/2 touch-none rounded-full [box-shadow:0_0_3px_3px_rgba(0,0,0,0.2)_inset] [&[data-zoomed="false"]]:pointer-events-none',
          {
            'pointer-events-none': !store.zoomed,
          },
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <MemoizedLens
        image={canvasData?.canvas}
        width={lensSize}
        height={lensSize}
        sourceWidth={canvasData?.cssWidth}
        sourceHeight={canvasData?.cssHeight}
        ior={1.4}
        chromaticAberration={0.01}
        className={cn('loupe-lens')}
      />
      <Dial
        key={isMobile ? 'mobile' : 'desktop'}
        className="loupe-dial pointer-events-none absolute inset-0 z-50"
        inscription="1x - 3x Professional Loupe"
        size={dialSize}
        tickCount={isMobile ? 120 : 180}
        tickLength={isMobile ? 4 : 8}
        tickWidth={1}
        tickColor={colors.stone[200]}
        snapAngle={10}
        stiffness={500}
        damping={50}
        value={scale}
        step={0.01}
        onChange={setScale}
        minAngle={0}
        minValue={1}
        maxValue={3}
        maxAngle={360}
      />
    </motion.div>
  );
}

export default Loupe;
