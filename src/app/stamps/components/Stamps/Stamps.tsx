'use client';

import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import React, {
  ComponentProps,
  CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import FocusLock from 'react-focus-lock';
import colors from 'tailwindcss/colors';

import useMatchMedia from '~/src/hooks/useMatchMedia';
import { cn, preloadImage } from '~/src/util';

import { ensureStampAtlas, getStampAtlas, preloadStampAtlases } from '../../atlas-utils';
import { collections, CollectionType } from '../../constants';
import { Stamp } from '../../models';
import { usePlayLoupeActivationSound, usePlayLoupeDeactivationSound } from '../../sounds';
import { useStampStore } from '../../store';
import CanvasGrid from '../CanvasGrid';
import CollectionsList from '../CollectionsList';
import { DrawnActionButton } from './ActionButton';
import DrawnOrganize from './actions/organize.svg';
import DrawnShuffle from './actions/shuffle.svg';
import { FeedbackDialog } from './Feedback';
import { Footer } from './Footer';
import LoupeSource from './Loupe/LoupeSource';
import { PunchPattern } from './PunchPattern';
import StampBoard from './StampBoard';
import StampCard from './StampCard';
import StampMotionController, { FOCUS_MS } from './StampMotionController';
import { getStampId, getStampIdFromEvent, stampFadeInProps, useIsMobile, whenElementSized } from './util';

const dismissPad = { x: 56, top: 24, bottom: 112 };

const Loupe = dynamic(() => import('./Loupe'), { ssr: false });

const directionKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

function LoupeHost({
  stamp,
  atlas,
  sizeScale,
  centerScale,
  gridCellSize,
  isMobile,
  containerRef,
  board,
}: {
  stamp?: Stamp;
  atlas?: ReturnType<typeof getStampAtlas>;
  sizeScale: number;
  centerScale: number;
  gridCellSize: number;
  isMobile: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  board: StampBoard;
}) {
  const isZoomed = useStampStore((s) => s.isZoomed);
  const overlayOpen = useStampStore((s) => s.overlayOpen);
  const [warmedStampId, setWarmedStampId] = useState<string | null>(null);

  useEffect(() => {
    board.setInert(stamp?.id ?? null, isZoomed);
  }, [board, isZoomed, stamp?.id]);

  useEffect(() => {
    setWarmedStampId(null);
    if (!stamp) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    const startedAt = performance.now();

    const run = async () => {
      try {
        const { width, height } = await whenElementSized(container);
        if (cancelled) {
          return;
        }

        await LoupeSource.prepare(
          LoupeSource.request({
            stamp,
            atlas,
            sizeScale,
            centerScale,
            cssWidth: width,
            cssHeight: height,
            gridCellSize,
            isMobile,
          }),
        );
      } catch {}

      if (cancelled) {
        return;
      }

      const wait = Math.max(0, FOCUS_MS - (performance.now() - startedAt));
      window.setTimeout(() => {
        if (!cancelled) {
          setWarmedStampId(stamp.id);
        }
      }, wait);
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [atlas, centerScale, containerRef, gridCellSize, isMobile, sizeScale, stamp]);

  if (!stamp || !(isZoomed || warmedStampId === stamp.id)) {
    return null;
  }

  return (
    <FocusLock
      disabled={!isZoomed || overlayOpen}
      returnFocus={false}
      className={cn({ 'pointer-events-none': !isZoomed })}
    >
      <Loupe
        gridCellSize={gridCellSize}
        centerScale={centerScale}
        sizeScale={sizeScale}
        atlas={atlas}
        key={stamp.id}
        selectedStamp={stamp}
        dragConstraints={containerRef}
      />
    </FocusLock>
  );
}

function shouldIgnoreStampHotkeys(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.closest('[data-slot="dialog-content"], [role="dialog"]')) {
    return true;
  }
  if (target.isContentEditable) {
    return true;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export default function Stamps({ className, ...props }: ComponentProps<typeof motion.div>) {
  const selectedStampId = useStampStore((s) => s.selectedStampId);
  const collectionKey = useStampStore((s) => s.collection);
  const playLoupeActivationSound = usePlayLoupeActivationSound();
  const playLoupeDeactivationSound = usePlayLoupeDeactivationSound();

  const collection = collections[collectionKey];
  const stamps: Stamp[] = collection.stamps;
  const atlas = getStampAtlas(collectionKey);

  const isMobile = useIsMobile(false);
  const isMobileSmall = useMatchMedia('(max-width: 639px)', false);

  const centerScale = isMobile ? 2 : 1.5;
  const sizeScale = isMobileSmall ? 0.6 : isMobile ? 0.8 : 1;

  const selectedStamp = stamps.find((stamp) => stamp.id === selectedStampId);

  useEffect(() => {
    preloadStampAtlases();
  }, []);

  useEffect(() => {
    if (selectedStamp?.srcLg) {
      preloadImage(selectedStamp.srcLg);
      void LoupeSource.prefetch(selectedStamp.srcLg, selectedStamp.src).catch(() => undefined);
    }
  }, [selectedStamp?.src, selectedStamp?.srcLg]);

  const boardRef = useRef<StampBoard | null>(null);
  if (boardRef.current === null) {
    boardRef.current = new StampBoard();
  }
  const board = boardRef.current;

  const focusedStampIdRef = useRef<string | null>(null);
  const collectionRequestRef = useRef(0);
  const stampsContainerRef = useRef<HTMLDivElement>(null);
  const stampsDragContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const focusById = useCallback((id: string | null) => {
    if (!id) {
      return;
    }

    const el = board.getElement(id);
    if (!el) {
      return;
    }

    el.focus();
    focusedStampIdRef.current = id;
  }, [board]);

  const getIndexById = useCallback(
    (id: string | null | undefined) => {
      if (!id) {
        return null;
      }
      return stamps.findIndex((stamp) => stamp.id === id);
    },
    [stamps],
  );

  const getNextFocusId = useCallback(
    (nextIndex: number) => {
      if (!stamps.length) {
        return null;
      }
      if (nextIndex < 0) {
        return stamps.at(-1)?.id ?? null;
      }
      if (nextIndex >= stamps.length) {
        return stamps[0]?.id ?? null;
      }
      return stamps[nextIndex]?.id ?? null;
    },
    [stamps],
  );

  const handleOrganize = useCallback(() => {
    const container = stampsDragContainerRef.current;
    const parent = stampsContainerRef.current;
    if (!container || !parent) {
      return;
    }

    board.organize({
      container,
      parent,
      ids: stamps.map((stamp) => stamp.id),
    });
  }, [board, stamps]);

  const handleDragStart = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const id = getStampIdFromEvent(event);
      if (id === null) {
        return;
      }

      if (!board.getEntry(id)) {
        return;
      }

      board.placeOnTop(id);
      board.setDragging(id, true);
    },
    [board],
  );

  const handleDragEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const id = getStampIdFromEvent(event);
    if (id === null) {
      return;
    }

    board.setDragging(id, false);
  }, [board]);

  const handleSpreadOut = useCallback(
    ({ stagger = 5 }: { stagger?: number } = {}) => {
      let i = 0;

      for (const stamp of stamps) {
        const controller = board.getController(stamp.id);
        if (!controller || controller.id === useStampStore.getState().selectedStampId) {
          continue;
        }

        controller.spreadOut({
          container: stampsDragContainerRef.current!,
          dist: 500,
          padding: 50,
          delay: i * stagger,
        });
        i++;
      }
    },
    [board, stamps],
  );

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!stampsDragContainerRef.current) {
        return;
      }
      handleSpreadOut({ stagger: 5 });
    });
    return () => cancelAnimationFrame(frame);
  }, [collectionKey, handleSpreadOut]);

  const handleSelectStamp = useCallback(
    (id: string) => {
      const entry = board.getEntry(id);
      if (entry?.dragging) {
        return;
      }

      const { selectedStampId: focusedId, selectStamp } = useStampStore.getState();
      if (focusedId && focusedId !== id) {
        board.getController(focusedId)?.unfocus();
      }

      board.placeOnTop(id);
      board.getController(id)?.focusInContainer(containerRef.current!, centerScale);
      selectStamp(id);
    },
    [board, centerScale],
  );

  const handleDeselectStamp = useCallback(() => {
    const { selectedStampId: focused, isZoomed: zoomed, deselectStamp } = useStampStore.getState();
    if (!focused) {
      return;
    }

    if (zoomed) {
      playLoupeDeactivationSound();
    }

    deselectStamp();
  }, [playLoupeDeactivationSound]);

  const handleDeactivateZoom = useCallback(() => {
    const { isZoomed: zoomed, setZoomed } = useStampStore.getState();
    if (!zoomed) {
      return;
    }

    playLoupeDeactivationSound();
    setZoomed(false);
  }, [playLoupeDeactivationSound]);

  const handleToggleZoom = useCallback(() => {
    if (useStampStore.getState().isZoomed) {
      handleDeactivateZoom();
      return;
    }

    playLoupeActivationSound();
    useStampStore.getState().setZoomed(true);
  }, [handleDeactivateZoom, playLoupeActivationSound]);

  useEffect(() => {
    return useStampStore.subscribe((state, prev) => {
      if (state.selectedStampId || !prev.selectedStampId) {
        return;
      }

      board.getController(prev.selectedStampId)?.unfocus();
      board.placeOnTop(prev.selectedStampId);
    });
  }, [board]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { selectedStampId: selectedId, isZoomed: zoomed } = useStampStore.getState();
      if (!selectedId || shouldIgnoreStampHotkeys(e.target)) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        if (zoomed) {
          handleDeactivateZoom();
          return;
        }

        handleDeselectStamp();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (zoomed) {
          return;
        }
        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        const selectedIndex = stamps.findIndex((stamp) => stamp.id === selectedId);
        const nextIndex = (selectedIndex + direction + stamps.length) % stamps.length;
        handleSelectStamp(stamps[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleDeselectStamp, handleDeactivateZoom, handleSelectStamp, stamps]);

  const handleControllerRef = useCallback(
    (controller: StampMotionController | null, id?: string) => {
      if (controller) {
        board.register(controller);
        return;
      }
      board.unregister(id);
    },
    [board],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const id = getStampId(e.currentTarget);
      if (id === null || id === useStampStore.getState().selectedStampId) {
        return;
      }

      if (e.target !== e.currentTarget) {
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        handleSelectStamp(id);
      }
    },
    [handleSelectStamp],
  );

  const handleStampClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const id = getStampId(e.currentTarget);
      if (id === null || id === useStampStore.getState().selectedStampId) {
        return;
      }

      if ((e.target as HTMLElement).closest('button, a, [data-slot="dialog-content"]')) {
        return;
      }

      e.stopPropagation();
      handleSelectStamp(id);
      handleDeactivateZoom();
    },
    [handleDeactivateZoom, handleSelectStamp],
  );

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) {
        return;
      }

      const selected = board.getElement(useStampStore.getState().selectedStampId);
      const artwork = selected?.querySelector('[data-slot="stamp-image"]');
      const target = artwork instanceof HTMLElement ? artwork : selected;
      if (target) {
        const rect = target.getBoundingClientRect();
        if (
          e.clientX >= rect.left - dismissPad.x &&
          e.clientX <= rect.right + dismissPad.x &&
          e.clientY >= rect.top - dismissPad.top &&
          e.clientY <= rect.bottom + dismissPad.bottom
        ) {
          return;
        }
      }

      handleDeselectStamp();
    },
    [board, handleDeselectStamp],
  );

  const handlePreloadCollection = useCallback((c: CollectionType) => {
    void ensureStampAtlas(c).catch(() => {});
  }, []);

  const handleSelectCollection = useCallback(
    async (c: CollectionType) => {
      if (c === collectionKey) {
        collectionRequestRef.current += 1;
        return;
      }

      const request = ++collectionRequestRef.current;
      try {
        await ensureStampAtlas(c);
      } catch {
        return;
      }
      if (request !== collectionRequestRef.current) {
        return;
      }
      if (useStampStore.getState().selectedStampId) {
        handleDeselectStamp();
      }
      useStampStore.getState().setCollection(c);
    },
    [collectionKey, handleDeselectStamp],
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const count = stamps.length;
      if (!count) {
        return;
      }

      if (directionKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }

      const i = getIndexById(focusedStampIdRef.current);
      if (e.key === 'Home') {
        focusById(stamps[0]?.id ?? null);
        return;
      }
      if (e.key === 'End') {
        focusById(stamps.at(-1)?.id ?? null);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const nextId = getNextFocusId((i ?? 0) - 1);
        focusById(nextId);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const nextId = getNextFocusId((i ?? 0) + 1);
        focusById(nextId);
        return;
      }
    },
    [stamps, getNextFocusId, focusById, getIndexById],
  );

  const handleListFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      if (e.target !== stampsContainerRef.current) {
        return;
      }

      const firstId = focusedStampIdRef.current ?? stamps[0]?.id ?? null;
      focusById(firstId);

      if (stampsContainerRef.current) {
        stampsContainerRef.current.tabIndex = -1;
      }
    },
    [focusById, stamps],
  );

  const handleListBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    const related = e.relatedTarget;

    if (!stampsContainerRef.current) {
      return;
    }
    if (!related || !stampsContainerRef.current.contains(related)) {
      stampsContainerRef.current.tabIndex = 0;
    }
  }, []);

  const handleStampFocusReturn = useCallback(() => {
    stampsContainerRef.current?.focus({ preventScroll: true });
  }, []);

  const gridCellSize = isMobile ? 16 : 32;
  const hasSelection = Boolean(selectedStampId);

  return (
    <motion.div
      className={cn(
        'group/stamps-container grid h-full grid-cols-[1fr_auto] grid-rows-[auto_auto_1fr] bg-stone-100 lg:grid-cols-[56px_1fr_auto] lg:grid-rows-[1fr_auto] lg:py-5',
        {
          'touch-none': selectedStampId,
        },
        className,
      )}
      {...props}
    >
      <div className="col-[1/3] row-1 flex-col items-center justify-center border-b border-dashed border-stone-300 lg:col-1 lg:flex lg:border-b-0">
        <PunchPattern className="flex-row px-2 py-4 lg:flex-col lg:px-0 lg:py-0" />
      </div>
      <div
        data-vaul-no-drag
        className="relative row-3 flex h-full items-start lg:row-1"
        ref={containerRef}
        onClick={handleContainerClick}
      >
        <div
          className="pointer-events-none absolute inset-0 top-1/2 left-1/2 z-0 h-full w-full -translate-x-1/2 -translate-y-1/2 overflow-clip border border-solid border-stone-300 duration-500 select-none"
        >
          <CanvasGrid
            background={colors.stone[100]}
            foreground={colors.stone[300]}
            cellWidth={gridCellSize}
            cellHeight={gridCellSize}
            align="top"
            className="absolute inset-0 opacity-40 lg:opacity-100"
          />
        </div>
        <div
          className="stamps-list pointer-events-none absolute inset-0 focus-visible:outline-none"
          ref={stampsContainerRef}
          role="list"
          tabIndex={0}
          aria-label={`${collectionKey} Stamps List`}
          data-has-selection={hasSelection ? 'true' : undefined}
          onFocus={handleListFocus}
          onBlur={handleListBlur}
          onKeyDown={handleListKeyDown}
        >
          <div
            className="stamp-drag-container pointer-events-none absolute inset-0 top-[70px] right-5"
            ref={stampsDragContainerRef}
            role="presentation"
            aria-hidden="true"
          />

          {stamps.map((stamp, index) => {
            return (
              <StampCard
                key={stamp.id}
                stamp={stamp}
                index={index}
                atlas={atlas}
                centerScale={centerScale}
                onControllerRef={handleControllerRef}
                onKeyDown={handleKeyDown}
                onClick={handleStampClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                dragConstraints={stampsDragContainerRef}
                sizeScale={sizeScale}
                onToggleZoom={handleToggleZoom}
                onDeactivateZoom={handleDeactivateZoom}
                onFocusReturn={handleStampFocusReturn}
              />
            );
          })}
        </div>
        <div
          className="absolute top-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-5"
        >
          <AnimatePresence mode="wait">
            {!hasSelection ? (
              <motion.div
                {...stampFadeInProps}
                key="collection-actions"
                className="flex items-center gap-5"
              >
                <DrawnActionButton
                  onClick={handleOrganize}
                  disabled={Boolean(selectedStampId)}
                  {...stampFadeInProps}
                  key="organize-button"
                >
                  <DrawnOrganize className="w-[95px]" aria-label="Organize Stamps" />
                </DrawnActionButton>

                <DrawnActionButton
                  onClick={() => handleSpreadOut({ stagger: 3 })}
                  disabled={Boolean(selectedStampId)}
                  custom={{ i: 1 }}
                  {...stampFadeInProps}
                  key="shuffle-button"
                >
                  <DrawnShuffle className="w-[90px]" aria-label="Shuffle Stamps" />
                </DrawnActionButton>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        <LoupeHost
          stamp={selectedStamp}
          atlas={atlas}
          sizeScale={sizeScale}
          centerScale={centerScale}
          gridCellSize={gridCellSize}
          isMobile={isMobile}
          containerRef={containerRef}
          board={board}
        />
      </div>
      <p id="stamps-navigation-help" className="sr-only">
        Use Left/Right/Up/Down to move focus between stamps. Home jumps to the first, End to the
        last. Press Space to open a stamp to see the details.
      </p>

      <div className="absolute top-[165px] right-0 row-3 w-8 lg:static lg:right-auto lg:row-1 lg:w-10">
        <CollectionsList
          className={cn(
            'absolute origin-bottom-left -translate-x-px -translate-y-8 rotate-90 group-[:has(div[data-state=open][data-slot=dialog-content])]/stamps-container:opacity-40 lg:-translate-y-10',
            {
              'opacity-40': selectedStampId,
            },
          )}
          collection={collectionKey}
          onCollectionClick={handleSelectCollection}
          onCollectionMouseOver={(c) => handlePreloadCollection(c)}
          onCollectionFocus={(c) => handlePreloadCollection(c)}
        />
      </div>
      <Footer
        className="col-1 row-2 py-2 pl-2 sm:py-2 sm:pb-2 lg:col-2 lg:row-2 lg:pl-0"
        onSelectCollection={handleSelectCollection}
      >
        <FeedbackDialog
          containerRef={containerRef}
          trigger={
            <button
              style={
                {
                  '--shimmer-bg': colors.stone[400],
                  '--shimmer-fg': colors.stone[500],
                } as CSSProperties
              }
              className="focus-dashed shimmer-text cursor-pointer font-mono uppercase lg:ml-0"
            >
              Give Feedback
            </button>
          }
        />
      </Footer>
    </motion.div>
  );
}
