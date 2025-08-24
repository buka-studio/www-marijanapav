import { AnimationControls, CustomValueType, motion, useAnimation } from 'framer-motion';
import { ComponentProps, forwardRef, useImperativeHandle, useRef } from 'react';

import { clamp, randInt } from '~/src/math';
import { cn } from '~/src/util';

interface Props {
  children: React.ReactNode;
  className?: string;
  draggableRef: React.RefObject<DraggableRef> | ((e: DraggableRef) => void);
}

export interface DraggableRef {
  center: (container: HTMLElement) => void;
  spreadOut: ({
    container,
    dist,
    rotate,
  }: {
    container: HTMLElement;
    dist: number;
    rotate: number;
  }) => void;
  unfocus: () => void;
  controls: AnimationControls;
}

type InitialPosition<T = string | number | CustomValueType> = {
  x: T;
  y: T;
  scale: T;
  rotate: T;
};

const DraggableStamp = forwardRef<HTMLDivElement, Props & ComponentProps<typeof motion.div>>(
  function DraggableStamp({ children, draggableRef, className, ...props }, ref) {
    const controls = useAnimation();

    const innerRef = useRef<HTMLDivElement | null>(null);

    const beforeFocus = useRef<InitialPosition>({
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0,
    });

    function calcTransformToCenter(container: HTMLElement) {
      const containerRect = container.getBoundingClientRect();

      if (!(containerRect && innerRef.current)) return { x: 0, y: 0 };

      const x = (containerRect.width - innerRef.current.clientWidth) / 2;
      const y = (containerRect.height - innerRef.current.clientHeight) / 2;

      return {
        x,
        y,
      };
    }

    useImperativeHandle(draggableRef, () => ({
      center: (container: HTMLElement) => {
        controls.start((_, current) => {
          beforeFocus.current = {
            scale: current.scale ?? 1,
            x: current.x ?? 0,
            y: current.y ?? 0,
            rotate: current.rotate ?? 0,
          };

          return {
            scale: 1.5,
            ...calcTransformToCenter(container),
            rotate: 0,
          };
        });
      },
      spreadOut: ({
        container,
        dist,
      }: {
        container: HTMLElement;
        dist: number;
        rotate: number;
      }) => {
        const containerRect = container.getBoundingClientRect();
        const elRect = innerRef.current?.getBoundingClientRect();

        const elWidth = elRect?.width ?? 0;
        const elHeight = elRect?.height ?? 0;

        controls
          .start({
            rotate: randInt(-35, 35),
            x: containerRect.width / 2 - elWidth,
            y: containerRect.height / 2 - elHeight,

            transition: {
              duration: 0,
            },
          })
          .then(() => {
            controls.start((_, current) => {
              const x = (current.x as number) || 0;
              const y = (current.y as number) || 0;

              return {
                x: clamp(0, containerRect.width - elWidth ?? 0, x + randInt(-dist, dist)),
                y: clamp(0, containerRect.height - elHeight ?? 0, y + randInt(-dist, dist)),
                opacity: 1,
              };
            });
          });
      },
      unfocus: () => controls.start(beforeFocus.current),
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
        drag
        dragTransition={{ bounceStiffness: 100, bounceDamping: 10, power: 0.4 }}
        dragElastic={0.5}
        transition={{ type: 'spring', stiffness: 500, damping: 80 }}
        className={cn('absolute flex origin-center', className)}
        animate={controls}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

export default DraggableStamp;
