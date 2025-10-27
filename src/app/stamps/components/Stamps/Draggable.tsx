import { motion, MotionProps, useAnimation } from 'framer-motion';
import { ComponentProps, useCallback, useImperativeHandle, useRef } from 'react';

import { clamp, randInt } from '~/src/math';
import { cn } from '~/src/util';

interface Props {
  children: React.ReactNode;
  index?: number;
  className?: string;
  draggableControllerRef?:
    | React.RefObject<DraggableController>
    | ((e: DraggableController) => void);
}

export interface DraggableController {
  id?: string;
  index?: number;
  center: (container: HTMLElement, scale: number) => void;
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
  controls: ReturnType<typeof useAnimation>;
}

type InitialPosition<T = string | number | any> = {
  x: T;
  y: T;
  z: T;
  scale: T;
  rotate: T;
};

const draggableProps: MotionProps = {
  whileDrag: { scale: 1.1, transition: { duration: 0.1 } },
  dragElastic: 0.1,
  dragTransition: { bounceStiffness: 100, bounceDamping: 10, power: 0.4 },
  transition: { type: 'spring', stiffness: 500, damping: 80 },
};

function calcTransformToCenter(container: HTMLElement, element: HTMLElement) {
  const containerRect = container.getBoundingClientRect();

  if (!(containerRect && element)) {
    return { x: 0, y: 0, z: 1 };
  }

  const x = (containerRect.width - element.clientWidth) / 2;
  const y = (containerRect.height - element.clientHeight) / 2;

  return {
    x,
    y,
    z: 1,
  };
}

function Draggable({
  children,
  draggableControllerRef,
  className,
  ref,
  index,
  id,
  ...props
}: Props & ComponentProps<typeof motion.div>) {
  const controls = useAnimation();

  const innerRef = useRef<HTMLDivElement | null>(null);

  const beforeFocus = useRef<InitialPosition>({
    scale: 1,
    x: 0,
    y: 0,
    rotate: 0,
    z: 1,
  });

  useImperativeHandle(draggableControllerRef, () => ({
    center: (container: HTMLElement, scale: number = 1.5) => {
      controls.start((_, current) => {
        beforeFocus.current = {
          scale: current.scale ?? 1,
          x: current.x ?? 0,
          y: current.y ?? 0,
          rotate: current.rotate ?? 0,
          z: current.z ?? 1,
        };

        return {
          scale: scale,
          ...calcTransformToCenter(container, innerRef.current!),
          z: 1,
          rotate: 0,
        };
      });
    },
    spreadOut: ({ container, dist }: { container: HTMLElement; dist: number; rotate: number }) => {
      const containerRect = container.getBoundingClientRect();
      const elRect = innerRef.current?.getBoundingClientRect();

      const elWidth = elRect?.width ?? 0;
      const elHeight = elRect?.height ?? 0;

      controls
        .start({
          rotate: randInt(-35, 35),
          x: containerRect.width / 2 - elWidth,
          y: containerRect.height / 2 - elHeight,
          z: 1,
          transition: {
            duration: 0,
          },
        })
        .then(() => {
          controls.start((_, current) => {
            const x = (current.x as number) || 0;
            const y = (current.y as number) || 0;

            return {
              x: clamp(0, containerRect.width - elWidth, x + randInt(-dist, dist)),
              y: clamp(0, containerRect.height - elHeight, y + randInt(-dist, dist)),
              z: 1,
              opacity: 1,
            };
          });
        });
    },
    unfocus: () => controls.start(beforeFocus.current),
    controls,
    index,
    id,
  }));

  const handleRef = useCallback(
    (e: HTMLDivElement) => {
      innerRef.current = e;
      if (typeof ref === 'function') {
        ref(e);
      } else if (ref) {
        ref.current = e;
      }
    },
    [ref],
  );

  return (
    <motion.div
      ref={handleRef}
      className={cn('absolute flex origin-center cursor-pointer', className)}
      animate={controls}
      drag
      {...draggableProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}
export default Draggable;
