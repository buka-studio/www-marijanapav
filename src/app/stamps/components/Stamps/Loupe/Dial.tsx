'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { remap } from '~/src/math';
import { cn } from '~/src/util';

import { useIsMobile } from '../util';

interface Props {
  size: number;
  tickCount: number;
  tickLength: number;
  tickWidth: number;
  tickColor: string;
  snapAngle?: number;
  stiffness?: number;
  damping?: number;
  onAngleChange?: (angle: number) => void;
  inscription: string;
  minAngle?: number;
  maxAngle?: number;
  className?: string;
  minValue?: number;
  maxValue?: number;
  step?: number;
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
}

export default function Dial({
  size: requestedSize,
  tickCount: requestedTickCount,
  tickLength,
  tickWidth,
  tickColor,
  inscription,
  value,
  onChange,
  minAngle,
  maxAngle,
  minValue,
  maxValue,
  step,
  stiffness = 500,
  damping = 50,
  onAngleChange,
  className,
  disabled,
}: Props) {
  const isMobile = useIsMobile();

  const padding = isMobile ? 14 : 20;
  const size = requestedSize - padding * 2;

  const tickCount = Math.floor(requestedTickCount / 5) * 5 - 1;
  const snapAngle = 360 / tickCount;

  const rotation = useMotionValue(
    remap(value ?? 0, minValue ?? 1, maxValue ?? 2, minAngle ?? 0, maxAngle ?? 360),
  );
  const rotationSpring = useSpring(rotation, { stiffness, damping });
  const dialRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const pointerTarget = useRef<
    (EventTarget & { releasePointerCapture?: (pointerId: number) => void }) | null
  >(null);

  const center = requestedSize / 2;
  const radius = size / 2;

  const calculateAngle = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) {
        return 0;
      }

      const rect = dialRef.current.getBoundingClientRect();
      const x = clientX - (rect.left + center);
      const y = clientY - (rect.top + center);
      let angle = Math.atan2(y, x) * (180 / Math.PI);
      angle = (angle + 360) % 360; // Normalize to 0-360

      // Snap to nearest multiple of snapAngle
      return Math.round(angle / snapAngle) * snapAngle;
    },
    [center, snapAngle],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation?.();

      isDragging.current = true;
      activePointerId.current = e.pointerId;
      lastAngle.current = calculateAngle(e.clientX, e.clientY);
      const target = e.currentTarget as HTMLElement;
      target.setPointerCapture?.(e.pointerId);
      pointerTarget.current = target;
    },
    [calculateAngle],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (
        !isDragging.current ||
        (activePointerId.current !== null && e.pointerId !== activePointerId.current)
      ) {
        return;
      }

      const currentAngle = calculateAngle(e.clientX, e.clientY);
      let deltaAngle = currentAngle - lastAngle.current;

      // Adjust for crossing 0/360 boundary
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      const newAngle = rotation.get() + deltaAngle;

      if (
        minAngle !== undefined &&
        maxAngle !== undefined &&
        (newAngle < minAngle || newAngle > maxAngle)
      ) {
        return;
      }

      onAngleChange?.(newAngle);

      const newValue = remap(
        newAngle,
        minAngle ?? 0,
        maxAngle ?? 360,
        minValue ?? 1,
        maxValue ?? 2,
      );
      onChange?.(newValue);

      rotation.set(newAngle);
      lastAngle.current = currentAngle;
    },
    [calculateAngle, minAngle, maxAngle, onAngleChange, rotation, minValue, maxValue, onChange],
  );

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (activePointerId.current !== null && e.pointerId !== activePointerId.current) {
      return;
    }
    isDragging.current = false;
    activePointerId.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const radius2 = size / 2 + (isMobile ? 8 : 12); // Increased radius by 10

    const angleOffset = snapAngle; // One step offset
    const angle = (i / tickCount) * 360 - angleOffset;

    const radians = (angle * Math.PI) / 180;
    const isLongTick = i % 5 === 0;

    const x1 = center + (radius2 - tickLength) * Math.cos(radians);
    const y1 = center + (radius2 - tickLength) * Math.sin(radians);
    const x2 = center + (isLongTick ? radius2 + tickLength * 0.5 : radius2) * Math.cos(radians);
    const y2 = center + (isLongTick ? radius2 + tickLength * 0.5 : radius2) * Math.sin(radians);

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={i === 0 ? 'transparent' : tickColor}
        strokeWidth={tickWidth}
      />
    );
  });

  const cx = center;
  const cy = center;

  useEffect(() => {
    if (value) {
      rotation.set(remap(value, minValue ?? 1, maxValue ?? 2, minAngle ?? 0, maxAngle ?? 360));
    }
  }, [value, minValue, maxValue, minAngle, maxAngle, rotation]);

  const fontSize = isMobile ? 6 : 10;
  const textRadius = isMobile ? radius - 2 : radius - 8;
  const highlightRadius = isMobile ? radius - 10 : radius - 22;
  const baseRadius = isMobile ? radius - 4 : radius - 10;
  const textOffset = isMobile ? 250 : 550;

  const handleRadius = 20;
  const handleVisualRadius = 5;
  const handleInset = isMobile ? 8 : 10;

  return (
    <div
      className={cn('group select-none [&:has(:focus-visible)_.handle]:fill-stone-50', className)}
    >
      <input
        type="range"
        min={minValue}
        max={maxValue}
        step={step}
        value={value}
        aria-label="Loupe scale"
        className="sr-only"
        onChange={(e) => {
          const newValue = Number(e.target.value);

          if (!Number.isFinite(newValue)) {
            return;
          }

          onChange?.(newValue);
          const angle = remap(
            newValue,
            minValue ?? 1,
            maxValue ?? 2,
            minAngle ?? 0,
            maxAngle ?? 360,
          );

          onAngleChange?.(angle);
        }}
        disabled={disabled}
      />

      <svg
        ref={dialRef}
        width={requestedSize}
        height={requestedSize}
        className="pointer-events-none select-none"
        viewBox={`0 0 ${requestedSize} ${requestedSize}`}
      >
        <motion.g style={{ rotate: rotationSpring }}>{ticks}</motion.g>

        <motion.g style={{ rotate: rotationSpring, transformOrigin: 'center center' }}>
          <circle
            cx={center}
            cy={center}
            r={radius + padding + handleRadius} // add handleRadius/2 so the container group is implicitly sized as a rectangle
            fill="none"
          />
          <circle
            className={cn('pointer-events-auto cursor-grab touch-none active:cursor-grabbing', {
              'pointer-events-none': disabled,
            })}
            onPointerDown={handlePointerDown}
            cx={center - 1}
            cy={padding - handleInset} // Position at the top, inset by circle radius
            r={handleRadius}
            fill="transparent"
          />

          <circle
            className="handle fill-stone-300"
            cx={center - 1}
            cy={padding - handleInset} // Position at the top, inset by circle radius
            r={handleVisualRadius}
            stroke="rgba(0,0,0,0.15)"
            strokeWidth={0.5}
            filter="drop-shadow(0px 0px 1px rgba(0,0,0,0.25))"
          />
        </motion.g>
        <circle
          cx={center}
          cy={center}
          r={radius + 2}
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth={1}
        />
        <circle
          cx={center}
          cy={center}
          r={baseRadius}
          fill="none"
          stroke="rgba(0,0,0,0.75)"
          filter="url(#blur-5)"
          className="base"
          strokeWidth={4}
        />

        <circle
          cx={center}
          cy={center}
          r={highlightRadius}
          fill="none"
          className="highlight"
          stroke="white"
          filter="url(#blur-2)"
          strokeWidth={2}
        />
        <path
          stroke="transparent"
          fill="transparent"
          id="path"
          d={`
      M ${cx - textRadius}, ${cy}
      a ${textRadius},${textRadius} 0 1,0 ${textRadius * 2},0
      a ${textRadius},${textRadius} 0 1,0 ${textRadius * -2},0
    `}
        />
        <text style={{ fontSize }}>
          <textPath href="#path" startOffset={0} fill="rgba(255,255,255,0.75)">
            {inscription}
          </textPath>
          <textPath href="#path" startOffset={textOffset} fill="rgba(255,255,255,0.75)">
            {inscription}
          </textPath>
        </text>

        <defs>
          <filter id="blur-2">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
          <filter id="blur-5">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
