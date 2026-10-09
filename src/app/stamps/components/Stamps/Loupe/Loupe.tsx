'use client';

import { motion, Point, useAnimation, useAnimationFrame, useDragControls } from 'framer-motion';
import type React from 'react';
import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import colors from 'tailwindcss/colors';

import { clamp } from '~/src/math';
import { cn } from '~/src/util';

import type { StampAtlas } from '../../../atlas';
import { Stamp } from '../../../models';
import { usePlayLoupeZoomClick } from '../../../sounds';
import { useStampStore } from '../../../store';
import { useIsMobile } from '../util';
import Dial from './Dial';
import Lens from './Lens';
import LoupeSource from './LoupeSource';

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

function getStampCenterInContainer(container: HTMLElement, stampId: string) {
  const stamp =
    (container.querySelector(`[data-id="${stampId}"] [data-slot="stamp-image"]`) as HTMLElement | null) ||
    (container.querySelector(`[data-id="${stampId}"]`) as HTMLElement | null);
  const fallback = {
    x: container.offsetWidth / 2,
    y: container.offsetHeight / 2,
  };
  if (!stamp) {
    return fallback;
  }

  const containerRect = container.getBoundingClientRect();
  const stampRect = stamp.getBoundingClientRect();
  if (stampRect.width < 1 || stampRect.height < 1) {
    return fallback;
  }

  return {
    x: stampRect.left - containerRect.left + stampRect.width / 2,
    y: stampRect.top - containerRect.top + stampRect.height / 2,
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

const directionKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Shift'];
const loupeScaleClickIncrement = 0.012;
const loupeScaleClickMinIntervalMs = 20;

function LoupeDial({
  isMobile,
  isZoomed,
  dialSize,
}: {
  isMobile: boolean;
  isZoomed: boolean;
  dialSize: number;
}) {
  const scale = useStampStore((s) => s.loupeScale);
  const playLoupeZoomClick = usePlayLoupeZoomClick();
  const lastScaleClickStepRef = useRef(Math.round(scale / loupeScaleClickIncrement));
  const lastScaleClickAtRef = useRef(0);

  const handleScaleChange = useCallback(
    (nextScale: number) => {
      useStampStore.getState().setLoupeScale(nextScale);

      const nextStep = Math.round(nextScale / loupeScaleClickIncrement);
      if (nextStep === lastScaleClickStepRef.current) {
        return;
      }

      const now = performance.now();
      lastScaleClickStepRef.current = nextStep;

      if (now - lastScaleClickAtRef.current < loupeScaleClickMinIntervalMs) {
        return;
      }

      lastScaleClickAtRef.current = now;
      playLoupeZoomClick();
    },
    [playLoupeZoomClick],
  );

  return (
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
      onChange={handleScaleChange}
      minAngle={0}
      minValue={1}
      maxValue={3}
      maxAngle={360}
      disabled={!isZoomed}
    />
  );
}

interface Props {
  selectedStamp: Stamp;
  dragConstraints: React.RefObject<HTMLElement | null>;
  className?: string;
  centerScale: number;
  gridCellSize: number;
  sizeScale: number;
  atlas?: StampAtlas;
}

export default function Loupe({
  selectedStamp,
  dragConstraints,
  className,
  centerScale,
  gridCellSize,
  sizeScale,
  atlas,
}: Props) {
  const isMobile = useIsMobile();
  const isZoomed = useStampStore((s) => s.isZoomed);

  const lensSize = isMobile ? 135 : 300;
  const dialSize = isMobile ? 190 : 400;

  const magnifierControls = useAnimation();
  const dialDragControls = useDragControls();

  const draggingMagnifier = useRef(false);
  const draggingMagnifierRefOffset = useRef<{ x: number; y: number } | null>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const pressedKeysRef = useRef<Set<string>>(new Set());
  const rafTimeRef = useRef<number | null>(null);
  const [source, setSource] = useState<LoupeSource | null>(null);
  const [lensReady, setLensReady] = useState(false);
  const readySourceRef = useRef<LoupeSource | null>(null);
  const wasZoomedRef = useRef(false);

  useLayoutEffect(() => {
    const container = dragConstraints.current;
    if (!container) {
      return;
    }

    const wasZoomed = wasZoomedRef.current;
    const opening = isZoomed && !wasZoomed;
    const closing = !isZoomed && wasZoomed;
    wasZoomedRef.current = isZoomed;

    if (opening || (!isZoomed && !closing)) {
      const center = getStampCenterInContainer(container, selectedStamp.id);
      const radius = dialSize / 2;
      const x = clamp(radius, container.offsetWidth - radius, center.x);
      const y = clamp(radius, container.offsetHeight - radius, center.y);

      useStampStore.getState().setLoupeCoords({ x, y });
      magnifierControls.set({
        x: x - radius,
        y: y - radius,
      });
    }

  }, [dialSize, dragConstraints, isZoomed, lensReady, magnifierControls, selectedStamp.id]);

  useEffect(() => {
    const container = dragConstraints.current;
    if (!container) {
      return;
    }

    let requestId = 0;
    let timer = 0;
    let width = 0;
    let height = 0;

    const run = async (id: number, cssWidth: number, cssHeight: number) => {
      try {
        const next = await LoupeSource.prepare(
          LoupeSource.request({
            stamp: selectedStamp,
            atlas,
            sizeScale,
            centerScale,
            cssWidth,
            cssHeight,
            gridCellSize,
            isMobile,
          }),
        );
        if (id === requestId) {
          const { loupeCoords, isZoomed: zoomed, setLoupeCoords } = useStampStore.getState();
          if (zoomed) {
            const radius = dialSize / 2;
            const x = clamp(radius, cssWidth - radius, loupeCoords.x);
            const y = clamp(radius, cssHeight - radius, loupeCoords.y);
            setLoupeCoords({ x, y });
            magnifierControls.set({ x: x - radius, y: y - radius });
          }
          if (next === readySourceRef.current) {
            setLensReady(true);
          }
          setSource(next);
        }
      } catch {
        if (id === requestId) {
          setSource(null);
        }
      }
    };

    const observer = new ResizeObserver(() => {
      const nextWidth = container.offsetWidth;
      const nextHeight = container.offsetHeight;
      if (nextWidth === width && nextHeight === height) {
        return;
      }
      const initial = width === 0 && height === 0;
      width = nextWidth;
      height = nextHeight;
      const id = ++requestId;
      window.clearTimeout(timer);
      setLensReady(false);
      if (width < 2 || height < 2) {
        return;
      }
      // Avoid building full-board textures for every intermediate resize size.
      timer = window.setTimeout(() => void run(id, nextWidth, nextHeight), initial ? 0 : 120);
    });
    observer.observe(container);

    return () => {
      requestId += 1;
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [atlas, centerScale, dialSize, dragConstraints, gridCellSize, isMobile, magnifierControls, selectedStamp, sizeScale]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      draggingMagnifier.current = true;
      dialDragControls.start(event);
      triggerRef.current?.setAttribute('data-dragging', 'true');

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
        container,
      );

      if (draggingMagnifier.current && dragConstraints.current) {
        const coords = {
          x: localCoords.x - (draggingMagnifierRefOffset.current?.x ?? 0),
          y: localCoords.y - (draggingMagnifierRefOffset.current?.y ?? 0),
        };

        const radius = dialSize / 2;

        const clampedX = clamp(radius, container.offsetWidth - radius, coords.x);
        const clampedY = clamp(radius, container.offsetHeight - radius, coords.y);

        useStampStore.getState().setLoupeCoords({
          x: clampedX,
          y: clampedY,
        });
      }
    },
    [dragConstraints, draggingMagnifier, draggingMagnifierRefOffset, dialSize],
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
      if (!isZoomed) return;
      if (directionKeys.includes(e.key)) {
        pressedKeysRef.current.add(e.key);
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [isZoomed],
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
    if (!container || !isZoomed) {
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

    const { x: cx, y: cy } = useStampStore.getState().loupeCoords;
    const newX = cx + vx * speed * dt;
    const newY = cy + vy * speed * dt;

    const radius = dialSize / 2;

    const clampedX = clamp(radius, container.offsetWidth - radius, newX);
    const clampedY = clamp(radius, container.offsetHeight - radius, newY);

    useStampStore.getState().setLoupeCoords({ x: clampedX, y: clampedY });

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
      data-zoomed={isZoomed}
      initial={false}
      dragElastic={0.01}
      dragListener={false}
      dragControls={dialDragControls}
      dragMomentum={false}
      dragConstraints={dragConstraints!}
      animate={magnifierControls}
      style={{ ...style, opacity: isZoomed && lensReady ? 1 : 0 }}
      className={cn(
        'loupe absolute top-0 left-0 z-100 flex aspect-square w-(--dial-size) items-center justify-center rounded-full bg-stone-400 shadow-md shadow-black/30 outline-offset-8 [&:has(.loupe-trigger:focus-visible)]:outline-stone-400 [&:has(.loupe-trigger:focus-visible)]:outline-dashed [&[data-zoomed="false"]_.loupe-lens]:pointer-events-none!',
        isZoomed ? 'pointer-events-auto' : 'pointer-events-none',
        className,
      )}
      aria-hidden={!isZoomed}
    >
      <div
        ref={triggerRef}
        className={cn(
          'loupe-trigger pointer-events-auto absolute inset-0 top-1/2 left-1/2 z-100 aspect-square w-(--lens-size) -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full [box-shadow:0_0_3px_3px_rgba(0,0,0,0.2)_inset] focus-visible:outline-none data-[dragging="true"]:cursor-grabbing data-[zoomed="false"]:pointer-events-none',
          {
            'pointer-events-none': !isZoomed,
          },
        )}
        role="region"
        tabIndex={isZoomed ? 0 : -1}
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
      {source ? (
        <Lens
          image={source.bitmap}
          width={lensSize}
          height={lensSize}
          sourceWidth={source.cssWidth}
          sourceHeight={source.cssHeight}
          ior={1.4}
          chromaticAberration={0.01}
          className="loupe-lens"
          live={isZoomed}
          onReady={() => {
            readySourceRef.current = source;
            setLensReady(true);
          }}
        />
      ) : null}
      <LoupeDial isMobile={isMobile} isZoomed={isZoomed} dialSize={dialSize} />
      <p id="stamps-loupe-description" className="sr-only">
        Use arrow keys to move the loupe. Press Tab to switch between local controls.
      </p>
    </motion.div>
  );
}
