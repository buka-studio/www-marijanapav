'use client';

import { Slot } from '@radix-ui/react-slot';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import React, {
  createContext,
  HTMLAttributes,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import useMatchMedia from '~/src/hooks/useMatchMedia';
import { clamp } from '~/src/math';
import { cn } from '~/src/util';

type FlipSide = 'front' | 'back';

interface FlipCardContextValue {
  side: FlipSide;
  setSide: (next: FlipSide) => void;
}

const FlipCardContext = createContext<FlipCardContextValue | null>(null);

function useFlipCardContext(component: string) {
  const ctx = useContext(FlipCardContext);
  if (!ctx) {
    throw new Error(`${component} must be used within <FlipCard>`);
  }
  return ctx;
}

function hasNoTiltAncestor(target: Element | null, container: HTMLElement) {
  let el: Element | null = target;
  while (el && el !== container) {
    if ((el as HTMLElement).dataset?.noTilt !== undefined) {
      return true;
    }
    el = el.parentElement;
  }

  return !!(el && (el as HTMLElement).dataset?.noTilt !== undefined);
}

interface FlipCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  side?: FlipSide;
  onSideChange?: (side: FlipSide) => void;
  asChild?: boolean;
  children?: React.ReactNode;
  disableTilt?: boolean;
  shine?: boolean;
}

function getHoverTiltFromPointer(opts: {
  event: React.MouseEvent<HTMLElement>;
  container: HTMLElement;
  factor: number;
}) {
  const { event, container, factor } = opts;
  const rect = container.getBoundingClientRect();

  const x = clamp(0, container.clientWidth, event.clientX - rect.left);
  const y = clamp(0, container.clientHeight, event.clientY - rect.top);

  const rotateY = (x / container.clientWidth) * factor - factor / 2;
  const rotateX = (y / container.clientHeight) * factor - factor / 2;

  return { rotateX, rotateY };
}

export function FlipCard({
  side: sideProp,
  onSideChange,
  asChild,
  className,
  style,
  onMouseMove,
  onMouseLeave,
  children,
  shine = true,
  disableTilt: _disableTilt = false,
  ...divProps
}: FlipCardProps) {
  const isTouch = useMatchMedia('(pointer: coarse)');
  const isControlled = typeof sideProp !== 'undefined';
  const [uncontrolledSide, setUncontrolledSide] = useState<FlipSide>('front');
  const side = (isControlled ? sideProp : uncontrolledSide) as FlipSide;

  const setSide = useCallback(
    (next: FlipSide) => {
      if (!isControlled) {
        setUncontrolledSide(next);
      }
      onSideChange?.(next);
    },
    [isControlled, onSideChange],
  );

  const prefersReduced = useReducedMotion();
  const disableTilt = prefersReduced || _disableTilt || isTouch;
  const flipY = useMotionValue(0);
  const flipSpring = useSpring(flipY, { stiffness: 250, damping: 40 });
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 400, damping: 30 });
  const springY = useSpring(tiltY, { stiffness: 400, damping: 30 });
  const compositeRotateY = useTransform(
    [flipSpring, springY],
    ([f, y]) => (Number(f) || 0) + (Number(y) || 0),
  );

  useEffect(() => {
    flipY.set(side === 'back' ? -180 : 0);
  }, [side, flipY]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const container = e.currentTarget;
      if (!container || disableTilt) {
        return;
      }
      const target = e.target;
      if (hasNoTiltAncestor(target as Element, container)) {
        return;
      }

      const t = getHoverTiltFromPointer({ event: e as any, container, factor: 5 });
      tiltX.set(t.rotateX);
      tiltY.set(t.rotateY);
    },
    [disableTilt, tiltX, tiltY],
  );

  const handleMouseLeave = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
  }, [tiltX, tiltY]);

  const ctx = useMemo<FlipCardContextValue>(() => ({ side, setSide }), [side, setSide]);

  const shineOffset = useTransform(springY, (value) => ((value ?? 0) / 10) * 120);
  const shineTransform = useMotionTemplate`translateX(${shineOffset}%)
  ${side === 'back' ? 'rotateY(180deg)' : ''}`;

  const content = (
    <FlipCardContext.Provider value={ctx}>
      <motion.div
        className="group/flipcard relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          rotateX: springX,
          rotateY: compositeRotateY,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {children}

        {shine && (
          <div className="pointer-events-none absolute inset-0 transform-[translateZ(2px)] overflow-clip">
            <motion.div
              aria-hidden
              className="hoverable:block absolute inset-0 hidden rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/flipcard:opacity-100"
              style={{
                mixBlendMode: 'soft-light',
                maskImage:
                  'linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 20%, rgba(0,0,0,1) 80%, transparent 100%)',
                background:
                  'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.1) 45%, transparent 70%)',
                filter: 'blur(2px)',
                transform: shineTransform,
              }}
            />
          </div>
        )}
      </motion.div>
    </FlipCardContext.Provider>
  );

  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      {...divProps}
      className={cn('relative', className)}
      style={{ perspective: '1200px', ...style }}
    >
      {content}
    </Comp>
  );
}

interface FaceProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  children?: React.ReactNode;
}

export function FlipCardFront({ asChild, className, style, children, ...divProps }: FaceProps) {
  const { side } = useFlipCardContext('FlipCardFront');
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      {...divProps}
      className={cn('absolute inset-0 transform-[translateZ(1px)] backface-hidden', className)}
      style={style}
      inert={side !== 'front'}
    >
      {children}
    </Comp>
  );
}

export function FlipCardBack({ asChild, className, style, children, ...divProps }: FaceProps) {
  const { side } = useFlipCardContext('FlipCardBack');
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      {...divProps}
      className={cn('absolute inset-0 backface-hidden', className)}
      style={{ transform: 'rotateY(180deg) translateZ(1px)', ...style }}
      inert={side !== 'back'}
    >
      {children}
    </Comp>
  );
}

interface FlipCardTriggerProps extends HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  children?: React.ReactNode;
  to?: FlipSide | 'toggle';
}

export function FlipCardTrigger({
  asChild,
  children,
  to = 'toggle',
  onClick,
  ...rest
}: FlipCardTriggerProps) {
  const { side, setSide } = useFlipCardContext('FlipCardTrigger');
  const handleClick = useCallback(() => {
    const next = to === 'toggle' ? (side === 'front' ? 'back' : 'front') : to;
    setSide(next);
  }, [side, setSide, to]);

  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      {...(asChild ? rest : { ...rest, type: 'button' })}
      onClick={(e: React.MouseEvent<any>) => {
        onClick?.(e);
        handleClick();
      }}
    >
      {children}
    </Comp>
  );
}

export default FlipCard;
