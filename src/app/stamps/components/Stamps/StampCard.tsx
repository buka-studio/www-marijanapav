'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ComponentProps, KeyboardEvent, memo, MouseEvent, RefObject, useState } from 'react';
import FocusLock from 'react-focus-lock';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '~/src/components/ui/Drawer';
import { cn } from '~/src/util';

import type { StampAtlas } from '../../atlas';
import { Stamp } from '../../models';
import { useStampStore } from '../../store';
import MetadataTable from '../MetadataTable';
import { DrawnActionButton } from './ActionButton';
import DrawnInfo from './actions/info.svg';
import DrawnZoom from './actions/zoom.svg';
import Draggable from './Draggable';
import { PunchPattern } from './PunchPattern';
import StampMotionController from './StampMotionController';
import StampSprite from './StampSprite';
import { stampFadeInProps } from './util';

type DraggableProps = ComponentProps<typeof Draggable>;

const invertScale = (scale: number) => 1 / scale;

interface Props {
  stamp: Stamp;
  index: number;
  atlas?: StampAtlas;
  centerScale: number;
  onControllerRef: (controller: StampMotionController | null, id?: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onClick: (event: MouseEvent<HTMLDivElement>) => void;
  onDragStart: DraggableProps['onDragStart'];
  onDragEnd: DraggableProps['onDragEnd'];
  dragConstraints: RefObject<HTMLDivElement | null>;
  sizeScale: number;
  onToggleZoom: () => void;
  onDeactivateZoom: () => void;
  onFocusReturn: () => void;
}

function StampCard({
  stamp,
  index,
  atlas,
  centerScale,
  onControllerRef,
  onKeyDown,
  onClick,
  onDragStart,
  onDragEnd,
  dragConstraints,
  sizeScale,
  onToggleZoom,
  onDeactivateZoom,
  onFocusReturn,
}: Props) {
  const isSelected = useStampStore((s) => s.selectedStampId === stamp.id);
  const isZoomed = useStampStore((s) => s.isZoomed && s.selectedStampId === stamp.id);
  const trapActive = useStampStore((s) => s.selectedStampId === stamp.id && !s.overlayOpen);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Draggable
      dragDisabled={isSelected}
      data-index={index}
      data-id={stamp.id}
      data-selected={isSelected ? 'true' : undefined}
      index={index}
      id={stamp.id}
      draggableControllerRef={onControllerRef}
      role="listitem"
      aria-current={isSelected ? 'true' : undefined}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      dragConstraints={dragConstraints}
      onClick={onClick}
      data-slot="stamp-container"
      className="focus-dashed group pointer-events-auto absolute z-(--z) flex items-center justify-center outline-offset-4"
    >
      <FocusLock
        disabled={!trapActive}
        group={`stamp-${stamp.id}`}
        returnFocus={false}
        autoFocus={false}
        onDeactivation={onFocusReturn}
        className={cn({ 'pointer-events-none': !isSelected })}
      >
        <AnimatePresence>
          {isSelected ? (
            <motion.div
              {...stampFadeInProps}
              key="stamp-actions"
              custom={{
                scale: invertScale(centerScale),
              }}
              className="pointer-events-auto absolute top-full z-10 flex w-full items-center justify-center gap-5 px-10 pt-2 pb-8 lg:pt-3"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <motion.div {...stampFadeInProps} key="info-button" className="lg:hidden">
                <Drawer
                  shouldScaleBackground={false}
                  onOpenChange={(open) => {
                    setDrawerOpen(open);
                    if (open) {
                      onDeactivateZoom();
                    }
                  }}
                  open={drawerOpen}
                >
                  <DrawerTrigger asChild>
                    <DrawnActionButton disabled={!stamp}>
                      <DrawnInfo className="w-[55px]" aria-label="Stamp Info" />
                    </DrawnActionButton>
                  </DrawerTrigger>

                  <DrawerContent
                    className="max-w-[100vw] rounded-none! border-none! bg-stone-100 shadow-[0_-2px_10px_0_rgba(0,0,0,0.05),0_-1px_6px_0_rgba(0,0,0,0.05)]"
                    handle={false}
                    overlayClassName="opacity-0!"
                  >
                    <div className="font-libertinus flex-1 overflow-y-auto pb-10">
                      <DrawerHeader className="sr-only">
                        <DrawerTitle>{stamp.title || 'Stamp Info'}</DrawerTitle>
                        <DrawerDescription>{stamp.country || ''}</DrawerDescription>
                      </DrawerHeader>
                      <PunchPattern className="sticky top-0 z-1 flex flex-row bg-stone-100 px-4 py-4" />
                      <div className="w-full border-b border-dashed border-stone-300"></div>
                      <div className="max-w-[100vw] p-5">
                        <MetadataTable />
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </motion.div>
              <DrawnActionButton
                onClick={onToggleZoom}
                {...stampFadeInProps}
                key="toggle-zoom-button"
                custom={{ i: 1 }}
              >
                <DrawnZoom
                  className={cn('w-[60px]', {
                    '[&_.plus-vertical]:hidden': isZoomed,
                  })}
                  aria-label="Toggle Zoom"
                />
              </DrawnActionButton>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </FocusLock>
      <StampSprite stamp={stamp} atlas={atlas} sizeScale={sizeScale} />
    </Draggable>
  );
}

export default memo(StampCard);
