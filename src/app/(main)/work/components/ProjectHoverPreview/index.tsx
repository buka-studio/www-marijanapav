'use client';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type MotionValue,
  type Transition,
  type Variants,
} from 'framer-motion';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ErrorBoundary } from 'react-error-boundary';

import useMatchMedia from '~/src/hooks/useMatchMedia';

import type { StaticProject } from '../../constants';
import Card from '../Card';
import CssGridPreview from './CssGridPreview';

const WebglGridPreview = dynamic(() => import('./WebglGridPreview'), { ssr: false });

type PreviewMotion = {
  xOffset: number;
  yOffset: number;
};

type Props = {
  projects: StaticProject[];
  hoveredIndex: number | null;
  previewX: MotionValue<number>;
  previewY: MotionValue<number>;
  previewMotion: PreviewMotion;
};

const previewMotionDuration = 0.25;

const previewMotionTransition: Transition = {
  opacity: { duration: previewMotionDuration / 2 },
  duration: previewMotionDuration,
};

const previewCardClass = 'overflow-hidden p-0 md:rounded';
const previewContainerClass = 'h-full w-full md:rounded';

export default function ProjectHoverPreview({
  projects,
  hoveredIndex,
  previewX,
  previewY,
  previewMotion,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isDesktop = useMatchMedia('(min-width: 768px)');
  const lastHoverIndexRef = useRef(0);
  const previewVariants: Variants = {
    initial: (motionValue: PreviewMotion) => ({
      opacity: 0,
      x: prefersReducedMotion ? 0 : motionValue.xOffset,
      y: prefersReducedMotion ? 0 : motionValue.yOffset,
      scale: prefersReducedMotion ? 1 : 0.98,
    }),
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
    exit: (motionValue: PreviewMotion) => ({
      opacity: 0,
      x: prefersReducedMotion ? 0 : motionValue.xOffset,
      y: prefersReducedMotion ? 0 : motionValue.yOffset,
      scale: prefersReducedMotion ? 1 : 0.98,
    }),
  };

  if (hoveredIndex !== null) {
    lastHoverIndexRef.current = hoveredIndex;
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const centerIndex = hoveredIndex ?? lastHoverIndexRef.current;

  return isDesktop
    ? createPortal(
        <motion.div
          className="pointer-events-none fixed z-50"
          aria-hidden
          style={{
            left: previewX,
            top: previewY,
            opacity: hoveredIndex !== null ? 1 : 0,
          }}
        >
          <Card containerClassName={previewContainerClass} className={previewCardClass}>
            <ErrorBoundary
              fallback={
                <CssGridPreview projects={projects} centerIndex={centerIndex} />
              }
              onError={(error, errorInfo) => {
                console.error('WebGL hover preview failed to render.', error, errorInfo);
              }}
            >
              <WebglGridPreview
                projects={projects}
                centerIndex={centerIndex}
                active={hoveredIndex !== null}
              />
            </ErrorBoundary>
          </Card>
        </motion.div>,
        document.body,
      )
    : createPortal(
        <AnimatePresence initial={false} custom={previewMotion}>
          {hoveredIndex !== null ? (
            <motion.div
              key="project-preview"
              className="pointer-events-none fixed z-50 hidden md:block"
              aria-hidden
              style={{ left: previewX, top: previewY }}
              custom={previewMotion}
              variants={previewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={previewMotionTransition}
            >
              <Card containerClassName={previewContainerClass} className={previewCardClass}>
                <CssGridPreview projects={projects} centerIndex={hoveredIndex} />
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      );
}
