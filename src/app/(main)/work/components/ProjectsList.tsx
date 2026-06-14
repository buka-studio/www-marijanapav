'use client';

import { ArrowUpRightIcon } from '@phosphor-icons/react';
import {
  AnimatePresence,
  motion,
  Transition,
  useMotionValue,
  useReducedMotion,
  type Variants,
} from 'framer-motion';
import Link from 'next/link';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { useSuperHoverRef } from 'super-hover/react';

import Image from '~/src/components/ui/Image';
import LinkBox, { LinkBoxLink } from '~/src/components/ui/LinkBox';

import { Project, StaticProject } from '../constants';
import Card from './Card';

import './ProjectsList.css';

type Props = {
  projects: Project[];
};

type PreviewMotion = {
  xOffset: number;
  yOffset: number;
};

type MotionDirection = 1 | -1;

type MotionAxisDirection = {
  x: MotionDirection;
  y: MotionDirection;
};

type MotionAxisAmount = {
  x: number;
  y: number;
};

const previewContainerMotionDirection: MotionAxisDirection = {
  x: 1,
  y: 1,
};

const previewContainerMotionAmount: MotionAxisAmount = {
  x: 1,
  y: 1,
};

const previewContentMotionDirection: MotionAxisDirection = {
  x: -1,
  y: -1,
};

const previewContentMotionAmount: MotionAxisAmount = {
  x: 2,
  y: 2,
};

const previewMotionDistance = 40;
const previewCursorOffset = 40;
const previewMotionDuration = 0.25;
const previewMotionVelocity = 1;

const previewMotionTransition: Transition = {
  opacity: { duration: previewMotionDuration / 2 },
  duration: previewMotionDuration,
};

type HoveredProject = {
  project: StaticProject;
  contentMotion: PreviewMotion;
};

function isStaticProject(project: Project): project is StaticProject {
  return project.type !== 'component';
}

function getFilterLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => (word.length >= 3 ? word[0].toUpperCase() + word.slice(1) : word.toUpperCase()))
    .join(' ');
}

function getProjectIndex(element: Element | null) {
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const index = Number(element.dataset.projectIndex);

  return Number.isFinite(index) ? index : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getEntryMotion({
  element,
  x,
  y,
  motionDistance,
}: {
  element: Element | null;
  x: number;
  y: number;
  motionDistance: number;
}): PreviewMotion {
  if (!(element instanceof HTMLElement)) {
    return { xOffset: 0, yOffset: 0 };
  }

  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const xRadius = rect.width / 2 || 1;
  const yRadius = rect.height / 2 || 1;

  return {
    xOffset: clamp(((x - centerX) / xRadius) * motionDistance, -motionDistance, motionDistance),
    yOffset: clamp(((y - centerY) / yRadius) * motionDistance, -motionDistance, motionDistance),
  };
}

function getPointerDirectionMotion({
  x,
  y,
  time,
  previousX,
  previousY,
  previousTime,
  motionDistance,
  motionVelocity,
}: {
  x: number;
  y: number;
  time: number;
  previousX: number | null;
  previousY: number | null;
  previousTime: number | null;
  motionDistance: number;
  motionVelocity: number;
}): PreviewMotion {
  if (previousX === null || previousY === null || previousTime === null) {
    return { xOffset: 0, yOffset: 0 };
  }

  const deltaX = x - previousX;
  const deltaY = y - previousY;
  const maxOffset = Math.max(Math.abs(deltaX), Math.abs(deltaY));

  if (maxOffset === 0) {
    return { xOffset: 0, yOffset: 0 };
  }

  const elapsed = Math.max(time - previousTime, 1);
  const pointerDistance = Math.hypot(deltaX, deltaY);
  const pointerVelocity = pointerDistance / elapsed;
  const velocityDistance =
    motionDistance * clamp(pointerVelocity / Math.max(motionVelocity, 0.001), 0, 1);
  const scale = velocityDistance / maxOffset;

  return {
    xOffset: clamp(deltaX * scale, -motionDistance, motionDistance),
    yOffset: clamp(deltaY * scale, -motionDistance, motionDistance),
  };
}

function hasPointerMotion({ xOffset, yOffset }: PreviewMotion) {
  return xOffset !== 0 || yOffset !== 0;
}

function getAdjustedPreviewMotion(
  { xOffset, yOffset }: PreviewMotion,
  direction: MotionAxisDirection,
  amount: MotionAxisAmount,
): PreviewMotion {
  return {
    xOffset: xOffset * direction.x * amount.x,
    yOffset: yOffset * direction.y * amount.y,
  };
}

function getItemRelationMotion({
  current,
  previous,
  motionDistance,
}: {
  current: Element | null;
  previous: Element | null;
  motionDistance: number;
}): PreviewMotion {
  if (!(current instanceof HTMLElement) || !(previous instanceof HTMLElement)) {
    return { xOffset: 0, yOffset: 0 };
  }

  const currentRect = current.getBoundingClientRect();
  const previousRect = previous.getBoundingClientRect();
  const currentCenterY = currentRect.top + currentRect.height / 2;
  const previousCenterY = previousRect.top + previousRect.height / 2;

  return {
    xOffset: 0,
    yOffset: previousCenterY < currentCenterY ? -motionDistance : motionDistance,
  };
}

function getItemEntryMotion({
  current,
  previous,
  x,
  y,
  pointerMotion,
  motionDistance,
}: {
  current: Element | null;
  previous: Element | null;
  x: number;
  y: number;
  pointerMotion: PreviewMotion;
  motionDistance: number;
}): PreviewMotion {
  if (previous instanceof HTMLElement) {
    return hasPointerMotion(pointerMotion)
      ? pointerMotion
      : getItemRelationMotion({ current, previous, motionDistance });
  }

  return getEntryMotion({ element: current, x, y, motionDistance });
}

function hostname(url: string): string {
  return new URL(url).hostname;
}

export default function ProjectsList({ projects }: Props) {
  const listProjects = useMemo(() => projects.filter(isStaticProject), [projects]);
  const [hoveredProject, setHoveredProject] = useState<HoveredProject | null>(null);
  const [previewMotion, setPreviewMotion] = useState<PreviewMotion>({
    xOffset: 0,
    yOffset: 0,
  });
  const activeIndexRef = useRef<number | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const pointerXRef = useRef<number | null>(null);
  const pointerYRef = useRef<number | null>(null);
  const pointerTimeRef = useRef<number | null>(null);
  const pointerMotionRef = useRef<PreviewMotion>({ xOffset: 0, yOffset: 0 });
  const exitMotionRef = useRef<PreviewMotion>({ xOffset: 0, yOffset: 0 });
  const previewX = useMotionValue(0);
  const previewY = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const previewVariants: Variants = {
    initial: (previewMotion: PreviewMotion) => {
      const { xOffset, yOffset } = getAdjustedPreviewMotion(
        previewMotion,
        previewContainerMotionDirection,
        previewContainerMotionAmount,
      );

      return {
        opacity: 0,
        x: prefersReducedMotion ? 0 : xOffset,
        y: prefersReducedMotion ? 0 : yOffset,
        scale: prefersReducedMotion ? 1 : 0.98,
      };
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
    exit: (previewMotion: PreviewMotion) => {
      const { xOffset, yOffset } = getAdjustedPreviewMotion(
        previewMotion,
        previewContainerMotionDirection,
        previewContainerMotionAmount,
      );

      return {
        opacity: 0,
        x: prefersReducedMotion ? 0 : xOffset,
        y: prefersReducedMotion ? 0 : yOffset,
        scale: prefersReducedMotion ? 1 : 0.98,
      };
    },
  };
  const previewImageVariants: Variants = {
    initial: ({ contentMotion }: HoveredProject) => {
      const { xOffset, yOffset } = getAdjustedPreviewMotion(
        contentMotion,
        previewContentMotionDirection,
        previewContentMotionAmount,
      );

      return {
        opacity: 0,
        x: prefersReducedMotion ? 0 : xOffset,
        y: prefersReducedMotion ? 0 : yOffset,
      };
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
    },
    exit: ({ contentMotion }: HoveredProject) => {
      const { xOffset, yOffset } = getAdjustedPreviewMotion(
        contentMotion,
        previewContentMotionDirection,
        previewContentMotionAmount,
      );

      return {
        opacity: 0,
        x: prefersReducedMotion ? 0 : xOffset,
        y: prefersReducedMotion ? 0 : yOffset,
      };
    },
  };

  function setPreviewPosition(x: number, y: number) {
    const previewWidth = 350;
    const previewHeight = 195;

    const prevX = Math.min(
      x + previewCursorOffset,
      window.innerWidth - previewWidth - previewCursorOffset,
    );
    const prevY = Math.min(
      y + previewCursorOffset,
      window.innerHeight - previewHeight - previewCursorOffset,
    );

    previewX.set(prevX);
    previewY.set(prevY);
  }

  const rootRef = useSuperHoverRef({
    onEnter(event) {
      const currentTime = performance.now();
      const nextIndex = getProjectIndex(event.detail.current);
      const project = nextIndex === null ? undefined : listProjects[nextIndex];
      const didEnterList = event.detail.previous === null && activeIndexRef.current === null;
      const previewEntryMotion = getEntryMotion({
        element: listRef.current,
        x: event.detail.x,
        y: event.detail.y,
        motionDistance: previewMotionDistance,
      });
      const eventPointerMotion = getPointerDirectionMotion({
        x: event.detail.x,
        y: event.detail.y,
        time: currentTime,
        previousX: pointerXRef.current,
        previousY: pointerYRef.current,
        previousTime: pointerTimeRef.current,
        motionDistance: previewMotionDistance,
        motionVelocity: previewMotionVelocity,
      });
      const pointerMotion = hasPointerMotion(eventPointerMotion)
        ? eventPointerMotion
        : pointerMotionRef.current;
      const contentMotion = getItemEntryMotion({
        current: event.detail.current,
        previous: event.detail.previous,
        x: event.detail.x,
        y: event.detail.y,
        pointerMotion,
        motionDistance: previewMotionDistance,
      });

      if (nextIndex === null || !project) {
        return;
      }

      setPreviewPosition(event.detail.x, event.detail.y);
      if (didEnterList) {
        setPreviewMotion(previewEntryMotion);
      }
      pointerXRef.current = event.detail.x;
      pointerYRef.current = event.detail.y;
      pointerTimeRef.current = currentTime;
      pointerMotionRef.current = { xOffset: 0, yOffset: 0 };
      exitMotionRef.current = didEnterList ? previewEntryMotion : contentMotion;
      activeIndexRef.current = nextIndex;
      setHoveredProject({
        project,
        contentMotion,
      });
    },
    onLeave(event) {
      if (event.detail.current) {
        return;
      }

      const currentTime = performance.now();
      const leaveMotion = getPointerDirectionMotion({
        x: event.detail.x,
        y: event.detail.y,
        time: currentTime,
        previousX: pointerXRef.current,
        previousY: pointerYRef.current,
        previousTime: pointerTimeRef.current,
        motionDistance: previewMotionDistance,
        motionVelocity: previewMotionVelocity,
      });
      const exitMotion =
        leaveMotion.xOffset || leaveMotion.yOffset ? leaveMotion : exitMotionRef.current;

      setPreviewMotion(exitMotion);
      activeIndexRef.current = null;
      pointerXRef.current = null;
      pointerYRef.current = null;
      pointerTimeRef.current = null;
      pointerMotionRef.current = { xOffset: 0, yOffset: 0 };
      exitMotionRef.current = { xOffset: 0, yOffset: 0 };
      setHoveredProject(null);
    },
    onMove(event) {
      const currentTime = performance.now();
      setPreviewPosition(event.detail.x, event.detail.y);
      const pointerMotion = getPointerDirectionMotion({
        x: event.detail.x,
        y: event.detail.y,
        time: currentTime,
        previousX: pointerXRef.current,
        previousY: pointerYRef.current,
        previousTime: pointerTimeRef.current,
        motionDistance: previewMotionDistance,
        motionVelocity: previewMotionVelocity,
      });
      pointerMotionRef.current = pointerMotion;
      exitMotionRef.current = hasPointerMotion(pointerMotion)
        ? pointerMotion
        : exitMotionRef.current;
      pointerXRef.current = event.detail.x;
      pointerYRef.current = event.detail.y;
      pointerTimeRef.current = currentTime;
    },
  });

  function handlePointerMove(event: PointerEvent<HTMLUListElement>) {
    const currentTime = performance.now();
    const pointerMotion = getPointerDirectionMotion({
      x: event.clientX,
      y: event.clientY,
      time: currentTime,
      previousX: pointerXRef.current,
      previousY: pointerYRef.current,
      previousTime: pointerTimeRef.current,
      motionDistance: previewMotionDistance,
      motionVelocity: previewMotionVelocity,
    });
    pointerMotionRef.current = pointerMotion;
    exitMotionRef.current = hasPointerMotion(pointerMotion) ? pointerMotion : exitMotionRef.current;
    pointerXRef.current = event.clientX;
    pointerYRef.current = event.clientY;
    pointerTimeRef.current = currentTime;
  }

  const setListRef = useCallback(
    (node: HTMLUListElement | null) => {
      listRef.current = node;
      rootRef(node);
    },
    [rootRef],
  );

  return (
    <div className="relative max-w-full min-w-0 overflow-hidden px-5 py-10">
      <div className="scroll-fade-x scrollbar-thumb-theme-2 max-w-full scrollbar-thin scrollbar-track-transparent overflow-x-auto overflow-y-hidden overscroll-x-contain">
        <ul className="w-full md:min-w-[900px]" ref={setListRef} onPointerMove={handlePointerMove}>
          {listProjects.map((project, i) => (
            <LinkBox asChild key={project.slug ?? project.title}>
              <li
                style={{ '--projects-list-row-index': i } as CSSProperties}
                data-project-index={i}
                data-super-hover
                className="projects-list-row border-theme-3 hover:text-text-primary data-[super-hover-active]:bg-theme-4 focus-within:bg-theme-4 focus-within:text-text-primary text-text-secondary relative grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-5 border-b px-3 py-3 text-sm leading-8 last:border-b-0 md:grid-cols-[4rem_minmax(16rem,1.7fr)_minmax(10rem,0.8fr)_minmax(10rem,0.8fr)]"
              >
                <span className="tabular-nums">{(i + 1).toString().padStart(3, '0')}</span>
                <span className="truncate text-right md:text-left">
                  <LinkBoxLink
                    asChild
                    className="focus-visible:outline-text-primary rounded-sm outline-offset-2 focus-visible:outline-2"
                  >
                    <Link
                      href={`/work/${project.slug}?view=list`}
                      className="hover:underline focus-visible:underline focus-visible:ring-0 focus-visible:outline-none!"
                    >
                      {project.title}
                    </Link>
                  </LinkBoxLink>
                </span>
                <span className="hidden truncate md:block">
                  {project.filters.map(getFilterLabel).join(', ')}
                </span>

                <span className="hidden truncate md:block">
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group/link hover:text-text-primary focus-visible:text-text-primary relative z-20 inline-flex max-w-full items-center gap-1 underline-offset-4 outline-offset-2 transition-colors duration-150 hover:underline focus-visible:underline focus-visible:outline-none!"
                    >
                      <span className="truncate">{hostname(project.link)}</span>
                      <ArrowUpRightIcon className="size-3 shrink-0 -translate-x-1 opacity-0 blur-[2px] transition-all duration-150 group-hover/link:translate-x-0 group-hover/link:opacity-100 group-hover/link:blur-none group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100 group-focus-visible/link:blur-none" />
                    </a>
                  ) : (
                    '-'
                  )}
                </span>
              </li>
            </LinkBox>
          ))}
        </ul>
      </div>

      <AnimatePresence initial={false} custom={previewMotion}>
        {hoveredProject && (
          <motion.div
            key="project-preview"
            className="pointer-events-none fixed z-20 hidden w-[350px] md:block"
            style={{ left: previewX, top: previewY }}
            custom={previewMotion}
            variants={previewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={previewMotionTransition}
          >
            <Card
              containerClassName="h-full w-full md:rounded"
              className="aspect-4/3 overflow-hidden p-0 md:rounded"
            >
              <AnimatePresence initial={false} custom={hoveredProject}>
                <motion.div
                  key={hoveredProject.project.slug ?? hoveredProject.project.title}
                  custom={hoveredProject}
                  className="absolute inset-0"
                  variants={previewImageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={previewMotionTransition}
                >
                  <Image
                    alt={hoveredProject.project.title}
                    src={hoveredProject.project.preview}
                    quality={90}
                    fill
                    className="object-cover object-top duration-150"
                    sizes="350px"
                  />
                </motion.div>
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
