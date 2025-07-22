'use client';

import {
  clamp,
  LegacyAnimationControls,
  motion,
  useAnimationControls,
  usePresence,
} from 'framer-motion';
import {
  ComponentProps,
  forwardRef,
  ReactNode,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

import { cn } from '~/src/util';

const Sketchbook = ({ className, line }: { className?: string; line?: boolean }) => (
  <div className={cn('flex h-[141px] w-[100px] rounded border border-current pl-2', className)}>
    {line && <div className="relative h-full w-px border-l border-dashed border-current" />}
  </div>
);

export interface AnimationRef {
  controls: LegacyAnimationControls;
}

export interface Props {
  children: React.ReactNode;
  className?: string;
  animationRef: React.Ref<AnimationRef>;
}

const SketchbookContainer = forwardRef<HTMLDivElement, Props & ComponentProps<typeof motion.div>>(
  function SketchbookContainer({ children, animationRef, className, ...props }, ref) {
    const controls = useAnimationControls();

    const innerRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(animationRef, () => ({
      controls,
    }));

    return (
      <motion.div
        ref={(e) => {
          innerRef.current = e;
          if (typeof ref === 'function') {
            ref(e);
          } else if (ref) {
            ref.current = e;
          }
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 80 }}
        className={cn('absolute flex origin-center opacity-0', className)}
        animate={controls}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function Sketchbooks({
  count,
  children,
  className,
}: {
  count: number;
  children: ReactNode;
  className?: string;
}) {
  const animationRefs = useRef(
    new Map<number, { animationRef: { controls: LegacyAnimationControls } }>(),
  );
  const sketchbookRefs = useRef(
    new Map<number, { e: HTMLElement; z: number; dragging: boolean }>(),
  );
  const constraintRef = useRef<HTMLDivElement | null>(null);

  const [isPresent, safeToRemove] = usePresence();

  useEffect(() => {
    if (!constraintRef.current) {
      return;
    }
    if (isPresent) {
      animationRefs.current.forEach(({ animationRef }) => {
        animationRef.controls.set({
          rotate: randInt(-35, 35),
          x: constraintRef.current?.offsetWidth! / 2 - 50,
          y: constraintRef.current?.offsetHeight! / 2 - 70,
          opacity: 0,
          transition: {
            duration: 0,
          },
        });

        animationRef.controls.start((_, current) => ({
          x: clamp(0, constraintRef.current?.offsetWidth!, Number(current.x) + randInt(-50, 50)),
          y: clamp(0, constraintRef.current?.offsetHeight!, Number(current.y) + randInt(-50, 50)),
          opacity: 1,
        }));
      });
    } else {
      animationRefs.current.forEach(({ animationRef }) => {
        animationRef.controls.start({
          rotate: randInt(-35, 35),
          x: Math.random() * constraintRef.current?.offsetWidth!,
          y: Math.random() * constraintRef.current?.offsetHeight!,
          opacity: 0,
        });
      });
      setTimeout(() => {
        safeToRemove();
      }, 300);
    }
  }, [isPresent, safeToRemove]);

  return (
    <div
      ref={constraintRef}
      className={cn('relative isolate h-full w-full', className)}
      onMouseEnter={() => {
        animationRefs.current.forEach(({ animationRef }) => {
          animationRef.controls.start({
            rotate: randInt(-10, 10),
            x: constraintRef.current?.offsetWidth! / 2 - 50,
            y: constraintRef.current?.offsetHeight! / 2 - 70,
            opacity: 1,
          });
        });
      }}
      onMouseLeave={() => {
        animationRefs.current.forEach(({ animationRef }) => {
          animationRef.controls.start({
            rotate: randInt(-35, 35),
            x: constraintRef.current?.offsetWidth! / 2 - 50 + randInt(-50, 50),
            y: constraintRef.current?.offsetHeight! / 2 - 70 + randInt(-50, 50),
          });
        });
      }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <SketchbookContainer
          key={index}
          ref={(e) => {
            sketchbookRefs.current.set(index, {
              z: 1,
              e: e!,
              dragging: false,
            });
          }}
          animationRef={(e) => {
            if (!e) {
              return;
            }
            animationRefs.current.set(index, { animationRef: e });
          }}
        >
          <Sketchbook
            className="absolute bg-panel-background text-theme-2"
            line={index === count - 1}
          />
        </SketchbookContainer>
      ))}
      {children}
    </div>
  );
}
