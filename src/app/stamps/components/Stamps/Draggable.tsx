'use client';

import type React from 'react';
import { useLayoutEffect, useRef } from 'react';

import { cn } from '~/src/util';

import StampMotionController from './StampMotionController';

interface Props {
  dragDisabled?: boolean;
  children: React.ReactNode;
  index?: number;
  id?: string;
  className?: string;
  dragConstraints?: React.RefObject<HTMLDivElement | null>;
  draggableControllerRef?:
    | React.RefObject<StampMotionController | null>
    | ((controller: StampMotionController | null, id?: string) => void);
  onDragStart?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  ref?: React.Ref<HTMLDivElement>;
}

export default function Draggable({
  children,
  draggableControllerRef,
  dragDisabled = false,
  className,
  ref,
  index,
  id,
  dragConstraints,
  onDragStart,
  onDragEnd,
  onClick,
  ...props
}: Props & Omit<React.ComponentProps<'div'>, keyof Props>) {
  const controllerRef = useRef<StampMotionController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = new StampMotionController();
  }
  const controller = controllerRef.current;

  controller.id = id;
  controller.index = index;
  controller.dragDisabled = dragDisabled;
  controller.onDragStart = onDragStart;
  controller.onDragEnd = onDragEnd;
  controller.onClick = onClick;

  useLayoutEffect(() => {
    if (typeof draggableControllerRef === 'function') {
      draggableControllerRef(controller, id);
    } else if (draggableControllerRef) {
      draggableControllerRef.current = controller;
    }

    return () => {
      if (typeof draggableControllerRef === 'function') {
        draggableControllerRef(null, id);
      } else if (draggableControllerRef) {
        draggableControllerRef.current = null;
      }
      controller.dispose();
    };
  }, [controller, draggableControllerRef, id, index]);

  return (
    <div
      {...props}
      ref={(node) => {
        controller.attachPlacementEl(node);
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn('absolute top-0 left-0 origin-center cursor-pointer touch-none', className)}
      onPointerDown={(event) => controller.pointerDown(event)}
      onPointerMove={(event) => controller.pointerMove(event, dragConstraints?.current ?? null)}
      onPointerUp={(event) => controller.pointerUp(event, dragConstraints?.current ?? null)}
      onPointerCancel={(event) => controller.pointerUp(event, dragConstraints?.current ?? null)}
      onClick={(event) => controller.click(event)}
    >
      <div
        ref={(node) => controller.attachFocusEl(node)}
        data-slot="stamp-focus"
        className="flex origin-center items-center justify-center"
      >
        {children}
      </div>
    </div>
  );
}
