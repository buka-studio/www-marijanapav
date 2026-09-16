'use client';

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from 'framer-motion';
import { memo, useId, useRef, useState } from 'react';

import Image from '~/src/components/ui/Image';

import type { StaticProject } from '../../constants';
import {
  CENTER_COL,
  CENTER_ROW,
  GRID_SIZE,
  gridMetrics,
  projectAt,
  visibleIndexRange,
  type HoverPreviewRendererProps,
} from './grid';
import { defaultMotionBlurParams, isMotionSettled, motionBlurT, stepSmoothedSpeed } from './motionBlur';
import { PREVIEW_CELL_WIDTH, PREVIEW_GAP } from './params';
import { usePreviewCenter } from './usePreviewCenter';

const PreviewItem = memo(function PreviewItem({
  project,
  index,
  stride,
  cellWidth,
  cellHeight,
}: {
  project: StaticProject;
  index: number;
  stride: number;
  cellWidth: number;
  cellHeight: number;
}) {
  return (
    <div
      className="absolute left-0"
      style={{
        top: index * stride,
        width: cellWidth,
        height: cellHeight,
      }}
    >
      <div className="bg-theme-3 relative h-full w-full overflow-hidden">
        <Image
          alt=""
          src={project.preview}
          fill
          quality={90}
          sizes="350px"
          transition={false}
          className="object-cover object-center"
        />
      </div>
    </div>
  );
});

export default function CssGridPreview({ projects, centerIndex }: HoverPreviewRendererProps) {
  const { cellWidth, cellHeight, gap, stride, gridWidth, gridHeight } = gridMetrics(
    PREVIEW_CELL_WIDTH,
    PREVIEW_GAP,
  );
  const center = usePreviewCenter(centerIndex);
  const prefersReducedMotion = useReducedMotion();
  const strideMv = useMotionValue(stride);
  const [liveIndex, setLiveIndex] = useState(centerIndex);
  const filterUid = useId().replace(/:/g, '');
  const filterId = `preview-motion-blur-${filterUid}`;
  const blurNodeRef = useRef<SVGFEGaussianBlurElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(0);
  const previousCenterRef = useRef(center.get());
  const blurActiveRef = useRef(false);
  const lastBlurRef = useRef('0 0');

  strideMv.set(stride);

  useMotionValueEvent(center, 'change', (value) => {
    const next = Math.round(value);
    setLiveIndex((current) => (current === next ? current : next));
  });

  useAnimationFrame((_, delta) => {
    const dt = Math.min(Math.max(delta / 1000, 1e-4), 0.064);
    const centerValue = center.get();
    const velocity = (Math.abs(centerValue - previousCenterRef.current) * stride) / dt;
    previousCenterRef.current = centerValue;
    const settled = isMotionSettled(centerValue, centerIndex);
    const reduceMotion = Boolean(prefersReducedMotion);

    if (settled || reduceMotion) {
      speedRef.current *= Math.exp(-dt * 32);
      if (speedRef.current < 48) {
        speedRef.current = 0;
      }
    } else {
      speedRef.current = stepSmoothedSpeed(speedRef.current, velocity, dt, defaultMotionBlurParams, false);
    }

    if (speedRef.current === 0 && !blurActiveRef.current) {
      return;
    }

    const blurT = motionBlurT(speedRef.current, defaultMotionBlurParams, reduceMotion);
    const blurPx = Number.isFinite(blurT)
      ? Math.min(blurT * blurT * defaultMotionBlurParams.maxBlur * cellHeight, 14)
      : 0;
    const active = blurPx > 0.6;
    const stdDeviation = active ? `0 ${blurPx.toFixed(1)}` : '0 0';

    if (blurNodeRef.current && lastBlurRef.current !== stdDeviation) {
      lastBlurRef.current = stdDeviation;
      blurNodeRef.current.setAttribute('stdDeviation', stdDeviation);
    }

    if (contentRef.current && active !== blurActiveRef.current) {
      blurActiveRef.current = active;
      contentRef.current.style.filter = active ? `url(#${filterId})` : 'none';
    }
  });

  const range = visibleIndexRange(liveIndex, centerIndex, projects.length);
  const y = useTransform(
    [center, strideMv],
    ([nextCenter, nextStride]: number[]) => -nextCenter * nextStride,
  );

  return (
    <div className="relative" style={{ width: cellWidth, height: cellHeight }}>
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="absolute grid"
          style={{
            top: -(cellHeight + gap),
            left: -(cellWidth + gap),
            gap,
            width: gridWidth,
            height: gridHeight,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${cellHeight}px)`,
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellWidth}px)`,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
            const row = Math.floor(i / GRID_SIZE);
            const col = i % GRID_SIZE;
            const isCenter = row === CENTER_ROW && col === CENTER_COL;

            return <div key={`${row}-${col}`} className="bg-theme-4" style={{ opacity: isCenter ? 1 : 0 }} />;
          })}
        </div>

        <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden>
          <filter
            id={filterId}
            x="0%"
            y="-40%"
            width="100%"
            height="180%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur ref={blurNodeRef} in="SourceGraphic" stdDeviation="0 0" />
          </filter>
        </svg>

        <div ref={contentRef} className="absolute inset-0 overflow-hidden contain-[paint]">
          <motion.div className="absolute top-0 left-0 will-change-transform" style={{ y }}>
            {Array.from({ length: range.end - range.start + 1 }, (_, offset) => {
              const index = range.start + offset;
              const project = projectAt(projects, index);

              if (!project) {
                return null;
              }

              return (
                <PreviewItem
                  key={project.slug ?? `${project.title}-${index}`}
                  project={project}
                  index={index}
                  stride={stride}
                  cellWidth={cellWidth}
                  cellHeight={cellHeight}
                />
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
