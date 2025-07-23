'use client';

import {
  motion,
  useAnimationControls,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ReactLenis, useLenis } from 'lenis/react';
import { useEffect, useRef, useState } from 'react';

import GridBackground from '~/src/components/GridBackground';
import CardTitle from '~/src/components/ui/CardTitle';
import Tag from '~/src/components/ui/Tag';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import useResizeRef from '~/src/hooks/useResizeRef';
import { remap } from '~/src/math';
import { cn } from '~/src/util';

import Stamp1 from '../../../public/home/stamps/stamp_1.svg';
import Stamp2 from '../../../public/home/stamps/stamp_2.svg';
import Stamp3 from '../../../public/home/stamps/stamp_3.svg';
import Stamp4 from '../../../public/home/stamps/stamp_4.svg';
import Stamp5 from '../../../public/home/stamps/stamp_5.svg';
import Card from './Card';

interface SkewedCardProps {
  index: number;
  children: React.ReactNode;
  count: number;
  width: number;
  height: number;
  activeIndex?: number | null;
  className?: string;
  style?: React.CSSProperties;
  spacing?: number;
  containerWidth: number;
  containerHeight: number;
  onActivate?: (index: number | null) => void;
}

export function SkewedCard({
  index,
  children,
  count,
  width = 200,
  height = 200,
  activeIndex,
  className,
  style,
  containerWidth,
  containerHeight,
  onActivate,
}: SkewedCardProps) {
  const scrollProgress = useMotionValue(0);
  const animationControls = useAnimationControls();

  const isTouch = useMatchMedia('(pointer: coarse)');

  const cardOffset = index / count;
  const initialProgress = cardOffset % 1;
  const initialZIndex = Math.floor(initialProgress * count);
  const [relativeZIndex, setRelativeZIndex] = useState(initialZIndex);
  const scrolling = useRef(false);
  const scale = useMotionValue(1);
  const springScale = useSpring(scale, {
    stiffness: 100,
    damping: 10,
    mass: 0.5,
  });

  const loopedProgress = useTransform(scrollProgress, (p) => {
    const cardOffset = index / count;

    return (p + cardOffset) % 1;
  });

  useMotionValueEvent(loopedProgress, 'change', (latest) => {
    const relativeZIndex = Math.floor(latest * count);
    setRelativeZIndex(relativeZIndex);
  });

  const x = useTransform(loopedProgress, (p) => remap(p, 0, 1, containerWidth, -width - width / 2));

  const y = useTransform(loopedProgress, (p) =>
    remap(p, 0, 1, -height, containerHeight + height / 2),
  );

  const lenis = useLenis((lenis: any) => {
    if (isTouch) {
      scrollProgress.set(1 - lenis.progress);
    } else {
      scrollProgress.set(lenis.progress);
    }

    scrolling.current = true;
    if (lenis.velocity < 0.1) {
      scrolling.current = false;
    }
  });

  const transform = useMotionTemplate`translate(${x}px, ${y}px) skewY(10deg) scale(${springScale})`;

  useEffect(() => {
    if (containerHeight > 0) {
      lenis?.scrollTo(200, {
        duration: 5,
      });

      animationControls.start({
        opacity: 1,
        filter: 'blur(0px)',
        transition: {
          delay: 0.05 * index,
          duration: 0.05 * index,
        },
      });
    }
  }, [containerWidth, containerHeight, index, animationControls, lenis]);

  return (
    <motion.div
      className={cn('absolute', className)}
      animate={animationControls}
      style={{
        height,
        width,
        top: -height / 2,
        zIndex: relativeZIndex,
        transform,
        opacity: 0,
        filter: 'blur(2px)',
        ...style,
      }}
      onHoverStart={() => {
        onActivate?.(index);
      }}
      onHoverEnd={() => {
        onActivate?.(null);
      }}
    >
      {children}
    </motion.div>
  );
}

export function Stamps({ width, height }: { width: number; height: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const numCards = 10;

  const stamps = [Stamp1, Stamp2, Stamp3, Stamp4, Stamp5];

  return (
    <div className="relative h-full w-full">
      <ReactLenis
        className="max-h-[420px] w-full overflow-hidden rounded-lg scrollbar-none"
        options={{
          infinite: true,
          syncTouch: true,
          syncTouchLerp: 0.2,
          duration: 2,
        }}
      >
        <div className="h-[1000px] w-full" />
        <div className="absolute right-0 top-0 mx-auto flex h-full w-full flex-col items-center overflow-hidden rounded-lg border border-panel-border">
          {Array.from({ length: numCards }).map((_, i) => {
            const Stamp = stamps[i % stamps.length];
            return (
              <SkewedCard
                activeIndex={activeIndex}
                index={i}
                count={numCards}
                key={i}
                width={150}
                height={200}
                containerWidth={width}
                containerHeight={height}
                onActivate={setActiveIndex}
                className="flex items-center justify-center"
              >
                <Stamp
                  className={cn(
                    '[--background:oklch(var(--theme-3))] [--foreground-muted:oklch(var(--text-primary))]',
                    '[.theme-dark_&]:[--background:oklch(var(--theme-1))] [.theme-dark_&]:[--foreground-muted:oklch(var(--theme-3))] [.theme-dark_&]:[--foreground:oklch(var(--theme-3))] [.theme-dark_&]:[--outline:oklch(var(--theme-2))]',
                    'h-auto w-[150px] drop-shadow-sm',
                  )}
                />
              </SkewedCard>
            );
          })}
        </div>
      </ReactLenis>
    </div>
  );
}

export default function SkewedStampsCard() {
  const { ref, dimensions } = useResizeRef<HTMLDivElement>();

  return (
    <Card id="stamps">
      <div className="flex flex-col">
        <div
          className="relative mb-5 h-full min-h-[240px] w-full overflow-auto rounded-md xl:min-h-[420px]"
          ref={ref}
        >
          <GridBackground className="absolute left-0 top-0 h-full w-full" n={300} />
          <Stamps width={dimensions.width} height={dimensions.height} />
        </div>
        <div className="mb-4 [&_>*]:inline [&_>*]:align-middle">
          <CardTitle variant="mono" className="flex items-center gap-2">
            <a href="#" className="group rounded-md">
              <span className="mr-1 inline-block">Digital Stamp Collection&nbsp;</span>
              <Tag
                variant="dashed"
                className="mb-[1px] inline-block py-[0.1rem] align-middle font-mono text-xs text-text-muted"
              >
                Coming&nbsp;soon
              </Tag>
            </a>
          </CardTitle>
        </div>
        <p className="text-sm  text-text-primary">
          Paying homage to my grandpa&apos;s lifelong passion for philately, by recreating his
          stamps in a digital form, exploring the blend of art, history, and typography and bringing
          it online for a new audience to enjoy.
        </p>
      </div>
    </Card>
  );
}
