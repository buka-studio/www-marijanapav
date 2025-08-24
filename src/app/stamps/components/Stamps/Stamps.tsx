import Image from 'next/image';
import { useEffect, useRef } from 'react';

import { cn } from '~/src/util';

import { collections, CollectionType } from '../../constants';
import { Stamp } from '../../models';
import { useZoomStore } from '../zoomStore';
import DraggableStamp, { DraggableRef } from './DraggableStamp';
import MagnifiedStamp from './MagnifiedStamp';

interface Props {
  onSelect: (stamp: Stamp | null) => void;
  className?: string;
  collection: CollectionType;
  selectedStamp?: Stamp | null;
}

interface StampRef {
  e: HTMLElement;
  z: number;
  dragging: boolean;
}

export default function Stamps({ onSelect, selectedStamp, className, collection }: Props) {
  const zoom = useZoomStore();
  const stamps = collections[collection].stamps;

  const stampRefs = useRef(new Map<number, StampRef>());

  function placeOnTop(i: number, dragging?: boolean) {
    const newMaxI = Math.max(...Array.from(stampRefs.current.values()).map(({ z }) => z)) + 1;

    const target = stampRefs.current.get(i);

    if (target?.e) {
      target.e.style.setProperty('--z', newMaxI.toString());

      stampRefs.current.set(i, {
        ...target,
        z: newMaxI,
        dragging: dragging || target.dragging,
      });
    }
  }

  function handleDragStart(i: number) {
    placeOnTop(i, true);
  }

  function handleDragEnd(i: number) {
    const target = stampRefs.current.get(i);

    if (!target) return;

    stampRefs.current.set(i, {
      ...target,
      dragging: false,
    });
  }

  function handleDragTransitionEnd(i: number) {
    const target = stampRefs.current.get(i);

    if (target) {
      stampRefs.current.set(i, {
        ...target,
        dragging: false,
      });
    }
  }

  const constraintRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (index: number) => {
    zoom.setZoomable(true);
    onSelect(stamps[index]);
  };

  const handleDeselect = () => {
    zoom.reset();
    onSelect(null);
  };

  const draggableRefs = useRef(new Map<number, DraggableRef>());

  const focusedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!constraintRef.current) return;

    (async () => {
      for (const [i, draggableRef] of draggableRefs.current.entries()) {
        await new Promise((resolve) => setTimeout(resolve, i * 10));
        draggableRef.spreadOut({ container: constraintRef.current!, dist: 500, rotate: 35 });
      }
    })();
  }, []);

  const handleStampClick = (index: number) => {
    if (stampRefs.current.get(index)?.dragging) return;
    const focusedIndex = focusedRef.current;

    if (focusedIndex != index) {
      draggableRefs.current.get(focusedIndex!)?.unfocus();
    }

    draggableRefs.current.get(index)?.center(constraintRef.current!);

    if (!stampRefs.current.get(index)?.dragging) {
      handleSelect(index);

      focusedRef.current = index;
    }
  };

  return (
    <div
      className={cn('relative flex h-full items-start', className)}
      ref={(e) => {
        constraintRef.current = e;
      }}
      onClick={(e) => {
        if (e.currentTarget !== e.target) return;

        handleDeselect();

        const focused = focusedRef?.current;
        draggableRefs.current.get(focused!)?.unfocus();
        focusedRef.current = null;
        placeOnTop(focused!);
      }}
    >
      {stamps.map((stamp, index) => {
        return (
          <DraggableStamp
            key={index}
            ref={(e) => {
              stampRefs.current.set(index, {
                z: 1,
                e: e!,
                dragging: false,
              });
            }}
            initial={{
              opacity: 0,
            }}
            draggableRef={(e) => {
              draggableRefs.current.set(index, e);
            }}
            onDragStart={() => handleDragStart(index)}
            onDragEnd={() => handleDragEnd(index)}
            onDragTransitionEnd={() => handleDragTransitionEnd(index)}
            dragTransition={{ bounceStiffness: 100, bounceDamping: 10, power: 0.4 }}
            dragConstraints={constraintRef}
            transition={{ type: 'spring', stiffness: 500, damping: 80 }}
            onClick={(e) => {
              e.stopPropagation();

              handleStampClick(index);
            }}
            className={cn('absolute z-[--z] flex transition-[filter] duration-200', {
              'blur-lg': selectedStamp && selectedStamp.id !== stamp.id,
              'pointer-events-none z-50': selectedStamp?.id === stamp.id,
            })}
          >
            <Image
              src={stamp.src}
              alt={stamp.country || ''}
              width={220}
              height={284}
              className="pointer-events-none"
            />
          </DraggableStamp>
        );
      })}

      {selectedStamp && (
        <MagnifiedStamp selectedStamp={selectedStamp} dragConstraints={constraintRef} />
      )}
    </div>
  );
}
