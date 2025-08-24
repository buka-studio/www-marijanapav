'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';

import { cn } from '~/src/util';

interface Props {
  size: number;
  lineCount: number;
  lineLength: number;
  lineWidth: number;
  lineColor: string;
  snapAngle?: number;
  stiffness?: number;
  damping?: number;
  onChangeAngle?: (angle: number) => void;
  inscription: string;
  minAngle?: number;
  maxAngle?: number;
  className?: string;
}

export default function RadialDial({
  size: requestedSize,
  lineCount: requestedLineCount,
  lineLength,
  lineWidth,
  lineColor,
  inscription,
  minAngle,
  maxAngle,
  stiffness = 500,
  damping = 50,
  onChangeAngle,
  className,
}: Props) {
  const padding = 20;
  const size = requestedSize - padding * 2;

  const lineCount = Math.floor(requestedLineCount / 5) * 5 - 1;
  const snapAngle = 360 / lineCount;

  const rotation = useMotionValue(0);
  const rotationSpring = useSpring(rotation, { stiffness, damping });
  const dialRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const lastAngle = useRef(0);

  const center = requestedSize / 2;
  const radius = size / 2;

  const calculateAngle = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return 0;

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      lastAngle.current = calculateAngle(e.clientX, e.clientY);
    },
    [calculateAngle],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;

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

      onChangeAngle?.(newAngle);
      rotation.set(newAngle);
      lastAngle.current = currentAngle;
    },
    [calculateAngle, minAngle, maxAngle, onChangeAngle, rotation],
  );

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const lines = Array.from({ length: lineCount }, (_, i) => {
    const radius2 = size / 2 + 12; // Increased radius by 10

    const angleOffset = snapAngle; // One step offset
    const angle = (i / lineCount) * 360 - angleOffset;

    const radians = (angle * Math.PI) / 180;
    const isLongLine = i % 5 === 0;

    const x1 = center + (radius2 - lineLength) * Math.cos(radians);
    const y1 = center + (radius2 - lineLength) * Math.sin(radians);
    const x2 = center + (isLongLine ? radius2 + lineLength * 0.5 : radius2) * Math.cos(radians);
    const y2 = center + (isLongLine ? radius2 + lineLength * 0.5 : radius2) * Math.sin(radians);

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={i === 0 ? 'transparent' : lineColor}
        strokeWidth={lineWidth}
      />
    );
  });

  const cx = center;
  const cy = center;
  const textRadius = radius - 5;

  return (
    <svg
      className={cn(className)}
      ref={dialRef}
      width={requestedSize}
      height={requestedSize}
      viewBox={`0 0 ${requestedSize} ${requestedSize}`}
    >
      <motion.g style={{ rotate: rotationSpring }}>{lines}</motion.g>

      <motion.g style={{ rotate: rotationSpring, transformOrigin: 'center' }}>
        <circle cx={center} cy={center} r={radius + padding} fill="none" pointerEvents="none" />
        <circle
          className="pointer-events-auto cursor-grab fill-stone-300 active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          cx={center - 1}
          cy={padding - 10} // Position at the top, inset by circle radius
          r={5}
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={0.5}
          filter="drop-shadow(0px 0px 1px rgba(0,0,0,0.25))"
        />
      </motion.g>

      <circle
        cx={center}
        cy={center}
        r={radius - 10}
        fill="none"
        stroke="rgba(0,0,0,0.75)"
        filter="blur(8px)"
        strokeWidth={4}
      />
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
        r={radius - 22}
        fill="none"
        stroke="white"
        filter="blur(2px)"
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
      <text
        className="pointer-events-none select-none"
        style={{ fontSize: 10 }}
        fill="rgba(255,255,255,0.75)"
        filter="url(#inset-shadow)"
      >
        <textPath href="#path" startOffset={0}>
          {inscription}
        </textPath>
        <textPath href="#path" startOffset={600}>
          {inscription}
        </textPath>
      </text>
    </svg>
  );
}
