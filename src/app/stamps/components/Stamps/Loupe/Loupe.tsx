import { motion, Point, useAnimation, useAnimationFrame, useDragControls } from 'framer-motion';
import { CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import colors from 'tailwindcss/colors';

import { clamp } from '~/src/math';
import { cn } from '~/src/util';

import { Stamp } from '../../../models';
import { useStampStore } from '../../../store';
import { drawGrid, setupHiDPICtx } from '../../CanvasGrid/util';
import { useIsMobile } from '../util';
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

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
}

async function loadFirstImage(srcs: string[]) {
  for (const src of srcs) {
    const img = await loadImage(src);
    if (img) {
      return img;
    }
  }
  return null;
}

const initial = {
  opacity: 0,
};

const directionKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift'];

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

  const isMobile = useIsMobile();
  const store = useStampStore();

  const lensSize = isMobile ? 135 : 300;
  const dialSize = isMobile ? 190 : 400;

  const magnifierControls = useAnimation();
  const dialDragControls = useDragControls();

  const draggingMagnifier = useRef(false);
  const draggingMagnifierRefOffset = useRef<{ x: number; y: number } | null>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const pressedKeysRef = useRef<Set<string>>(new Set());
  const rafTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!dragConstraints?.current) {
      return;
    }

    if (store.isZoomed) {
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
  }, [store.isZoomed, magnifierControls, dragConstraints, setCoords, dialSize]);

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

    const stampImgEl =
      activeStampContainerRef.current?.querySelector(`[data-slot="stamp-image"]`) ||
      document.querySelector(`[data-id="${selectedStamp.id}"] [data-slot="stamp-image"]`);
    if (!stampImgEl) {
      return;
    }

    drawGrid(ctx, {
      width: container.offsetWidth,
      height: container.offsetHeight,
      align: 'top',
      cellWidth: gridCellSize,
      cellHeight: gridCellSize,
      background: colors.stone[100],
      foreground: isMobile ? colors.stone[200] : colors.stone[300],
      lineWidth: 1,
    });

    loadFirstImage([selectedStamp.srcLg, selectedStamp.src])
      .then((img) => {
        if (!img) {
          return;
        }

        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.shadowBlur = 20;

        const imgWidth = stampImgEl.clientWidth * baseScale;
        const imgHeight = stampImgEl.clientHeight * baseScale;

        const centerX = container.offsetWidth / 2;
        const centerY = container.offsetHeight / 2;

        ctx.drawImage(img, centerX - imgWidth / 2, centerY - imgHeight / 2, imgWidth, imgHeight);
      })
      .finally(() => {
        // todo: error handling
        setCanvasData({
          canvas,
          cssWidth: container.offsetWidth,
          cssHeight: container.offsetHeight,
        });
      });
  }, [
    isMobile,
    lensSize,
    selectedStamp,
    dragConstraints,
    baseScale,
    gridCellSize,
    activeStampContainerRef,
  ]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      draggingMagnifier.current = true;
      dialDragControls.start(event);
      triggerRef.current?.setAttribute('data-dragging', 'true');

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
    triggerRef.current?.removeAttribute('data-dragging');
  }, [draggingMagnifier]);

  const handlePointerLeave = useCallback(() => {
    draggingMagnifier.current = false;
    dialDragControls.cancel();
    triggerRef.current?.removeAttribute('data-dragging');
  }, [draggingMagnifier, dialDragControls]);

  const style = useMemo(
    () =>
      ({
        '--lens-size': `${lensSize}px`,
        '--dial-size': `${dialSize}px`,
      }) as CSSProperties,
    [lensSize, dialSize],
  );

  const handleTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!store.isZoomed) return;
      if (directionKeys.includes(e.key)) {
        pressedKeysRef.current.add(e.key);
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [store.isZoomed],
  );

  const handleTriggerKeyUp = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (directionKeys.includes(e.key)) {
      pressedKeysRef.current.delete(e.key);
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const onBlur = useCallback(() => {
    pressedKeysRef.current.clear();
  }, []);

  useAnimationFrame((t) => {
    const container = dragConstraints.current;
    if (!container || !store.isZoomed) {
      rafTimeRef.current = t;
      return;
    }

    const prev = rafTimeRef.current ?? t;
    const dt = Math.min(0.05, (t - prev) / 1000);
    rafTimeRef.current = t;

    if (!pressedKeysRef.current.size) {
      return;
    }

    const pressedKeys = pressedKeysRef.current;

    const speed = 200 * (pressedKeys.has('Shift') ? 2 : 1);
    let vx = 0;
    let vy = 0;
    if (pressedKeys.has('ArrowLeft')) vx -= 1;
    if (pressedKeys.has('ArrowRight')) vx += 1;
    if (pressedKeys.has('ArrowUp')) vy -= 1;
    if (pressedKeys.has('ArrowDown')) vy += 1;
    if (!(vx || vy)) {
      return;
    }

    const len = Math.hypot(vx, vy) || 1;
    vx /= len;
    vy /= len;

    const { x: cx, y: cy } = useLoupeStore.getState().coords;
    const newX = cx + vx * speed * dt;
    const newY = cy + vy * speed * dt;

    const radius = dialSize / 2;

    const clampedX = clamp(radius, container.offsetWidth - radius, newX);
    const clampedY = clamp(radius, container.offsetHeight - radius, newY);

    useLoupeStore.setState({ coords: { x: clampedX, y: clampedY } });

    magnifierControls.start({
      x: clampedX - radius,
      y: clampedY - radius,
      transition: {
        duration: 0,
      },
    });
  });

  return (
    <motion.div
      drag
      data-zoomed={store.isZoomed}
      initial={initial}
      dragElastic={0.01}
      dragListener={false}
      dragControls={dialDragControls}
      dragMomentum={false}
      dragConstraints={dragConstraints!}
      animate={magnifierControls}
      style={style}
      className={cn(
        'loupe absolute z-100 flex aspect-square w-(--dial-size) items-center justify-center rounded-full bg-stone-400 shadow-md shadow-black/30  outline-offset-8 [&:has(.loupe-trigger:focus-visible)]:outline-dashed [&:has(.loupe-trigger:focus-visible)]:outline-stone-400 [&[data-zoomed="false"]_.loupe-lens]:pointer-events-none!',
        'shadow-md',
        className,
      )}
    >
      <div
        ref={triggerRef}
        className={cn(
          'loupe-trigger pointer-events-auto absolute inset-0 left-1/2 top-1/2 z-100 aspect-square w-(--lens-size) -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full [box-shadow:0_0_3px_3px_rgba(0,0,0,0.2)_inset] focus-visible:outline-none data-[dragging="true"]:cursor-grabbing data-[zoomed="false"]:pointer-events-none',
          {
            'pointer-events-none': !store.isZoomed,
          },
        )}
        role="region"
        tabIndex={0}
        aria-label="Stamps Loupe"
        aria-describedby="stamps-loupe-description"
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleTriggerKeyDown}
        onKeyUp={handleTriggerKeyUp}
        onBlur={onBlur}
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
        inscription="PEAK 1983  ⎟  10× Measuring Loupe  ⎟  Digital Stamp Collection · @marijanapav"
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
        disabled={!store.isZoomed}
      />
      <p id="stamps-loupe-description" className="sr-only">
        Use arrow keys to move the loupe. Press Tab to switch between local controls.
      </p>
    </motion.div>
  );
}

export default Loupe;
