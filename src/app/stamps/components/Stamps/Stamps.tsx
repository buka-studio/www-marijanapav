'use client';

import { AnimatePresence, motion, MotionProps, PanInfo, Transition } from 'framer-motion';
import Image from 'next/image';
import React, {
  ComponentProps,
  CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import colors from 'tailwindcss/colors';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '~/src/components/ui/Drawer';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import useResizeRef from '~/src/hooks/useResizeRef';
import { randInt } from '~/src/math';
import { cn, preloadImage } from '~/src/util';

import { collections, CollectionType } from '../../constants';
import { Stamp } from '../../models';
import { useStampStore } from '../../store';
import CanvasGrid from '../CanvasGrid';
import CollectionsList from '../CollectionsList';
import MetadataTable from '../MetadataTable';
import { DrawnActionButton } from './ActionButton';
import DrawnInfo from './actions/info.svg';
import DrawnOrganize from './actions/organize.svg';
import DrawnShuffle from './actions/shuffle.svg';
import DrawnZoom from './actions/zoom.svg';
import Draggable, { DraggableController } from './Draggable';
import { Footer } from './Footer';
import Loupe from './Loupe';
import { PunchPattern } from './PunchPattern';
import { computeGridArrangement } from './util';

interface DragContainerRef {
  e: HTMLElement;
  z: number;
  dragging: boolean;
}

const stampInitial = {
  opacity: 0,
  z: 1,
};

const invertScale = (scale: number) => {
  return 1 / scale;
};

const stampDefaultDimensions = { width: 160, height: 220 };
const dragContainerPadding = { top: 70, right: 20 };

const fadeInProps: MotionProps = {
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
  variants: {
    initial: ({ i = 0 } = {}) => ({
      opacity: 0,
      filter: 'blur(4px)',
      y: 10,
      transition: { delay: i * 0.05 },
    }),
    animate: ({ i = 0, scale = 1 } = {}) => ({
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      scale,
      transition: { delay: i * 0.05 },
    }),
    exit: ({ i = 0 } = {}) => ({
      opacity: 0,
      filter: 'blur(4px)',
      y: -10,
      transition: { delay: i * 0.05 },
    }),
  },
};

const MemoizedDraggable = memo(Draggable);

const stampTransition: Transition = { type: 'spring', stiffness: 500, damping: 80 };
const stampDragTransition: Transition = { bounceStiffness: 100, bounceDamping: 10, power: 0.4 };

const getAttribute = (e: { dataset: DOMStringMap } | null, attribute: string) => {
  if (!e) {
    return null;
  }

  const value = e.dataset[attribute];

  return value || null;
};

const getIndexAttribute = (e: { dataset: DOMStringMap } | null) => {
  const index = getAttribute(e, 'index');
  const n = Number(index);
  if (!Number.isFinite(n)) {
    return null;
  }

  return n;
};

const getIdAttribute = (e: { dataset: DOMStringMap } | null) => getAttribute(e, 'id');

export default function Stamps({ className, ...props }: ComponentProps<typeof motion.div>) {
  const store = useStampStore();
  const selectedStampId = useStampStore((s) => s.selectedStampId);
  const collectionKey = useStampStore((s) => s.collection);
  const setZoomEnabled = useStampStore((s) => s.setZoomEnabled);
  const setSelectedStampId = useStampStore((s) => s.setSelectedStampId);

  const collection = collections[collectionKey];
  const stamps = collection.stamps;

  const isMobile = useMatchMedia('(max-width: 1024px)', false);
  const isMobileSmall = useMatchMedia('(max-width: 640px)', false);

  const centerScale = isMobile ? 2 : 1.5;

  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedStamp = useMemo(
    () => stamps.find((stamp) => stamp.id === selectedStampId) as Stamp,
    [stamps, selectedStampId],
  );

  useEffect(() => {
    if (selectedStamp?.srcLg) {
      preloadImage(selectedStamp.srcLg);
    }
  }, [selectedStamp?.srcLg]);

  const draggableContainerRefs = useRef(new Map<string, DragContainerRef>());
  const draggableControllerRefs = useRef(new Map<string, DraggableController>());

  const selectedStampIdRef = useRef<string | null>(null);
  const selectedStampContainerRef = useRef<HTMLElement | null>(null);
  const stampsContainerRef = useRef<HTMLDivElement>(null);
  const stampsDragContainerRef = useRef<HTMLDivElement>(null);

  const { ref: containerRef, dimensions } = useResizeRef<HTMLDivElement>();

  const getMaxZ = useCallback(() => {
    return Math.max(...Array.from(draggableContainerRefs.current.values()).map(({ z }) => z)) + 1;
  }, [draggableContainerRefs]);

  const placeOnTop = useCallback(
    (id: string, forceZ?: number) => {
      const target = draggableContainerRefs.current.get(id);
      if (!target?.e) {
        return;
      }

      const newZ = forceZ ?? getMaxZ();

      target.e.style.setProperty('--z', newZ.toString());
      target.z = newZ;

      return newZ;
    },
    [draggableContainerRefs, getMaxZ],
  );

  const handleOrganize = useCallback(() => {
    const container = stampsDragContainerRef.current;
    if (!container) {
      return;
    }

    const childrenById = Object.fromEntries(
      stamps.flatMap((stamp) => {
        const e = draggableContainerRefs.current.get(stamp.id)?.e;
        return e
          ? [[stamp.id, { width: e.clientWidth, height: e.clientHeight, id: stamp.id }]]
          : [];
      }),
    );

    const paddingX = 12;
    const paddingY = 12;
    const gap = 12;

    const positions = computeGridArrangement({
      container,
      children: Object.values(childrenById),
      paddingX,
      paddingY,
      gap,
    });

    let i = 0;
    const maxZ = getMaxZ();

    for (const pos of positions.values()) {
      const draggable = draggableControllerRefs.current.get(pos.id);
      const container = draggableContainerRefs.current.get(pos.id);
      if (!draggable || !container) {
        continue;
      }

      const { width, height } = childrenById[pos.id]!;
      const left = pos.x - width / 2;
      const top = pos.y - height / 2;

      placeOnTop(pos.id, maxZ + i);
      i++;

      draggable.controls.start({
        x: left,
        y: top + dragContainerPadding.top,
        rotate: pos.fit ? randInt(-5, 5) : randInt(-35, 35),
        transition: { type: 'spring', stiffness: 500, damping: 80 },
      });
    }
  }, [
    draggableContainerRefs,
    draggableControllerRefs,
    stampsDragContainerRef,
    stamps,
    getMaxZ,
    placeOnTop,
  ]);

  const handleDragStart = useCallback(
    (e: MouseEvent | PointerEvent | TouchEvent, info: PanInfo) => {
      const id = getIdAttribute(e.target as HTMLElement);
      if (id === null) {
        return;
      }

      const target = draggableContainerRefs.current.get(id);
      if (!target) {
        return;
      }

      const newMaxI = placeOnTop(id);

      draggableContainerRefs.current.set(id, {
        ...target,
        z: newMaxI || 1,
        dragging: true,
      });
    },
    [placeOnTop],
  );

  const handleDragEnd = useCallback(
    (e: MouseEvent | PointerEvent | TouchEvent, info: PanInfo) => {
      const id = getIdAttribute(e.target as HTMLElement);
      if (id === null) {
        return;
      }

      const target = draggableContainerRefs.current.get(id);
      if (!target) {
        return;
      }

      draggableContainerRefs.current.set(id, {
        ...target,
        dragging: false,
      });
    },
    [draggableContainerRefs],
  );

  const handleDragTransitionEnd = useCallback(() => {
    for (const [index, target] of draggableContainerRefs.current.entries()) {
      if (target.dragging) {
        draggableContainerRefs.current.set(index, {
          ...target,
          dragging: false,
        });
      }
    }
  }, []);

  const handleSpreadOut = useCallback(
    async ({ stagger = 5 }: { stagger?: number }) => {
      let i = 0;

      for (const stamp of stamps) {
        const draggable = draggableControllerRefs.current.get(stamp.id);
        if (!draggable) {
          continue;
        }

        if (draggable.id === selectedStampIdRef.current) {
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, i * stagger));
        draggable.spreadOut({
          container: stampsDragContainerRef.current!,
          dist: 500,
          padding: 50,
        });

        i++;
      }
    },
    [draggableControllerRefs, stampsDragContainerRef, stamps],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    handleSpreadOut({ stagger: 5 });
  }, [collectionKey, containerRef, handleSpreadOut]);

  const handleSelectStamp = useCallback(
    (id: string) => {
      const target = draggableContainerRefs.current.get(id);
      if (target?.dragging) {
        return;
      }

      const focusedId = selectedStampIdRef.current;
      if (focusedId && focusedId !== id) {
        draggableControllerRefs.current.get(focusedId!)?.unfocus();
      }

      placeOnTop(id);
      draggableControllerRefs.current.get(id)?.center(containerRef.current!, centerScale);

      if (!target?.dragging) {
        setZoomEnabled(true);
        setSelectedStampId(id);

        selectedStampIdRef.current = id;
        selectedStampContainerRef.current = target?.e ?? null;

        draggableContainerRefs.current.get(id)?.e?.focus();
      }
    },
    [
      draggableContainerRefs,
      draggableControllerRefs,
      containerRef,
      setZoomEnabled,
      setSelectedStampId,
      centerScale,
      placeOnTop,
    ],
  );

  const containerMeasured = dimensions.width > 0 && dimensions.height > 0;

  const handleDeselectStamp = useCallback(
    (e?: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedStampIdRef.current) {
        return;
      }

      store.reset();

      const focused = selectedStampIdRef?.current;

      draggableControllerRefs.current.get(focused!)?.unfocus();
      selectedStampIdRef.current = null;

      placeOnTop(focused!);
    },
    [store, draggableControllerRefs, placeOnTop],
  );

  useEffect(() => {
    const focusWithinRef = containerRef.current?.contains(document.activeElement);
    if (!focusWithinRef) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedStampId) {
        if (e.key === 'Escape') {
          if (store.isZoomed) {
            store.setZoomed(false);
          } else {
            handleDeselectStamp();
          }
          return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          const direction = e.key === 'ArrowLeft' ? -1 : 1;
          const selectedIndex = stamps.findIndex((stamp) => stamp.id === selectedStampId);
          const nextIndex = (selectedIndex + direction + stamps.length) % stamps.length;
          const nextId = stamps[nextIndex].id;

          handleSelectStamp(nextId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedStampId,
    handleDeselectStamp,
    handleSpreadOut,
    store,
    containerRef,
    stamps,
    handleSelectStamp,
  ]);

  const handleDragContainerRef = useCallback(
    (e: HTMLElement | null) => {
      const id = getIdAttribute(e);
      if (id === null) {
        return;
      }

      draggableContainerRefs.current.set(id, {
        z: 1,
        e: e!,
        dragging: false,
      });
    },
    [draggableContainerRefs],
  );

  const handleDraggableControllerRef = useCallback(
    (e: DraggableController) => {
      if (!e) {
        return;
      }
      draggableControllerRefs.current.set(e.id!, e);
    },
    [draggableControllerRefs],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const id = getIdAttribute(e.currentTarget);
      if (id === null || id === selectedStampId) {
        return;
      }

      if (e.target !== e.currentTarget) {
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        handleSelectStamp(id);
      }
    },
    [handleSelectStamp, selectedStampId],
  );

  const handleStampClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const id = getIdAttribute(e.currentTarget);
      if (id === null || id === selectedStampId) {
        return;
      }

      if (e.target !== e.currentTarget) {
        return;
      }

      e.stopPropagation();

      handleSelectStamp(id);

      store.setZoomed(false);
    },
    [handleSelectStamp, store, selectedStampId],
  );

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleDeselectStamp();
      }
    },
    [handleDeselectStamp],
  );

  const handlePreloadCollection = useCallback((c: CollectionType) => {
    const collection = collections[c];
    for (const stamp of collection.stamps) {
      preloadImage(stamp.src);
    }
  }, []);

  const gridCellSize = isMobile ? 16 : 32;

  const showCollectionActions = Boolean(!selectedStampId);

  return (
    <motion.div
      className={cn(
        'grid h-full grid-cols-[1fr_auto] grid-rows-[auto_1fr_auto] bg-stone-100 lg:grid-cols-[56px_1fr_auto] lg:grid-rows-[1fr_auto] lg:py-5',
        {
          'opacity-0': !containerMeasured,
          'opacity-100': containerMeasured,
          'touch-none': selectedStampId,
        },
        className,
      )}
      {...props}
    >
      <div className="col-[1/3] row-[1] flex-col  items-center justify-center lg:col-[1] lg:flex">
        <PunchPattern className={cn('flex-row px-2 py-4 lg:flex-col lg:px-0 lg:py-0')} />
      </div>
      <div
        data-vaul-no-drag
        className={cn('relative row-[2] flex h-full items-start lg:row-[1]')}
        ref={containerRef}
        onClick={handleContainerClick}
      >
        <div
          className={cn(
            'pointer-events-none absolute inset-0 left-1/2 top-1/2 z-0 h-full w-full -translate-x-1/2 -translate-y-1/2 select-none overflow-clip border border-solid border-stone-300 duration-500',
          )}
        >
          <CanvasGrid
            width={dimensions.width}
            height={dimensions.height}
            background={colors.stone[100]}
            foreground={colors.stone[300]}
            cellWidth={gridCellSize}
            cellHeight={gridCellSize}
            align="top"
            className={cn(
              'absolute inset-0 left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 transition-opacity',
            )}
          />
        </div>
        {/* todo: inset top and right */}
        <div
          className="pointer-events-none absolute inset-0 transform-gpu border"
          ref={stampsContainerRef}
        >
          <div
            className="stamp-drag-container pointer-events-none absolute bottom-0 left-0"
            style={{
              top: dragContainerPadding.top,
              right: dragContainerPadding.right,
            }}
            ref={stampsDragContainerRef}
          />

          {stamps.map((stamp, index) => {
            return (
              <MemoizedDraggable
                key={stamp.id}
                ref={handleDragContainerRef}
                data-index={index}
                data-id={stamp.id}
                index={index}
                id={stamp.id}
                initial={stampInitial}
                transition={stampTransition}
                draggableControllerRef={handleDraggableControllerRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragTransitionEnd={handleDragTransitionEnd}
                dragTransition={stampDragTransition}
                dragConstraints={stampsDragContainerRef}
                onClick={handleStampClick}
                data-slot="stamp-container"
                className={cn(
                  'focus-dashed group pointer-events-auto absolute z-[--z] flex items-center justify-center outline-offset-4 transition-[filter] duration-200 will-change-transform',
                  {
                    'opacity-40 blur-lg': selectedStampId && selectedStampId !== stamp.id,
                    'pointer-events-none': selectedStampId,
                  },
                )}
              >
                <AnimatePresence>
                  {selectedStampId === stamp.id && (
                    <motion.div
                      {...fadeInProps}
                      key="stamp-actions"
                      custom={{
                        scale: invertScale(centerScale),
                      }}
                      className="pointer-events-auto absolute top-[calc(100%+8px)] flex items-center gap-5"
                    >
                      <motion.div {...fadeInProps} key="info-button" className="lg:hidden">
                        <Drawer
                          shouldScaleBackground={false}
                          onOpenChange={(open) => {
                            setDrawerOpen(open);
                            if (open) {
                              store.setZoomed(false);
                            }
                          }}
                          open={drawerOpen}
                        >
                          <AnimatePresence>
                            <DrawerTrigger asChild>
                              <DrawnActionButton disabled={!selectedStamp}>
                                <DrawnInfo className="w-[55px]" aria-label="Stamp Info" />
                              </DrawnActionButton>
                            </DrawerTrigger>
                          </AnimatePresence>

                          <DrawerContent
                            className="max-w-[100vw] !rounded-none !border-none bg-stone-100 shadow-[0_-2px_10px_0_rgba(0,0,0,0.05),0_-1px_6px_0_rgba(0,0,0,0.05)]"
                            handle={false}
                            overlayClassName="!opacity-0"
                          >
                            <div className="flex-1 overflow-y-auto pb-10 font-libertinus">
                              <DrawerHeader className="sr-only">
                                <DrawerTitle>{selectedStamp?.title || 'Stamp Info'}</DrawerTitle>
                                <DrawerDescription>
                                  {selectedStamp?.country || ''}
                                </DrawerDescription>
                              </DrawerHeader>
                              <PunchPattern className="sticky top-0 z-[1] flex flex-row bg-stone-100 px-4 py-4" />
                              <div className="w-full border-b border-dashed border-stone-300"></div>
                              <div className="max-w-[100vw] p-5">
                                {selectedStamp && <MetadataTable />}
                              </div>
                            </div>
                          </DrawerContent>
                        </Drawer>
                      </motion.div>
                      <DrawnActionButton
                        disabled={!store.zoomEnabled}
                        onClick={() => store.toggleZoomed()}
                        {...fadeInProps}
                        key="toggle-zoom-button"
                        custom={{ i: 1 }}
                      >
                        <DrawnZoom
                          className={cn('w-[75px]', {
                            '[&_.plus-vertical]:hidden': store.isZoomed,
                          })}
                          aria-label="Toggle Zoom"
                        />
                      </DrawnActionButton>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Image
                  src={stamp.src}
                  alt={stamp.country || ''}
                  width={stamp.width || stampDefaultDimensions.width}
                  height={stamp.height || stampDefaultDimensions.height}
                  priority
                  loading="eager"
                  style={
                    {
                      '--width': stamp.width || stampDefaultDimensions.width,
                      '--height': stamp.height || stampDefaultDimensions.height,
                      '--size-scale': isMobileSmall ? 0.6 : isMobile ? 0.8 : 1,
                    } as CSSProperties
                  }
                  data-slot="stamp-image"
                  className={cn(
                    'pointer-events-none h-auto w-[calc(var(--size-scale)*var(--width)*1px)] drop-shadow transition-all duration-200',
                  )}
                />
              </MemoizedDraggable>
            );
          })}
        </div>
        <div
          className={cn(
            'absolute left-1/2 top-8 z-[99999] flex -translate-x-1/2 items-center gap-5',
          )}
        >
          <AnimatePresence mode="wait">
            {showCollectionActions && (
              <motion.div
                {...fadeInProps}
                key="collection-actions"
                className="flex items-center gap-5"
              >
                <DrawnActionButton
                  onClick={handleOrganize}
                  disabled={Boolean(selectedStampId)}
                  {...fadeInProps}
                  key="organize-button"
                >
                  <DrawnOrganize className="w-[95px]" aria-label="Organize Stamps" />
                </DrawnActionButton>

                <DrawnActionButton
                  onClick={() => handleSpreadOut({ stagger: 5 })}
                  disabled={Boolean(selectedStampId)}
                  custom={{ i: 1 }}
                  {...fadeInProps}
                  key="shuffle-button"
                >
                  <DrawnShuffle className="w-[90px]" aria-label="Shuffle Stamps" />
                </DrawnActionButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {selectedStamp && (
          <Loupe
            gridCellSize={gridCellSize}
            className={cn({
              'pointer-events-none': !store.isZoomed,
            })}
            baseScale={centerScale}
            key={selectedStamp.id}
            selectedStamp={selectedStamp as unknown as Stamp}
            dragConstraints={containerRef}
            activeStampContainerRef={selectedStampContainerRef}
          />
        )}
      </div>

      <div className="relative w-8 lg:w-10">
        <CollectionsList
          className={cn(
            'absolute origin-bottom-left -translate-x-px -translate-y-8 rotate-90 lg:-translate-y-10',
          )}
          collection={store.collection}
          onCollectionClick={(c) => {
            handlePreloadCollection(c);
            store.setCollection(c as CollectionType);
          }}
          onCollectionMouseOver={(c) => handlePreloadCollection(c)}
          onCollectionFocus={(c) => handlePreloadCollection(c)}
        />
      </div>

      <Footer className="col-[1] row-[3] pl-2 lg:col-[2] lg:row-[2] lg:pl-0" />
    </motion.div>
  );
}
