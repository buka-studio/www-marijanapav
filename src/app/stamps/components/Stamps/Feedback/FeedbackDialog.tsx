'use client';

import { SpinnerIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import React, { ComponentProps, useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { DialogDescription, DialogTitle } from '~/src/components/ui/Dialog';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import { cn, preloadImage } from '~/src/util';

import FeedbackForm from './FeedbackForm';
import FlipCard, { FlipCardBack, FlipCardFront, FlipCardTrigger } from './FlipCard';
import {
  GenieAnimationController,
  GenieBackdrop,
  GenieDialog,
  GenieDialogContent,
  GenieDialogOverlay,
  GenieDialogPortal,
  GenieDialogTrigger,
} from './GenieDialog';

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  trigger: React.ReactNode;
}

async function withTimeout<T, U>(promise: Promise<T>, ms: number, value?: U): Promise<T | U> {
  let id: any;
  const timeout = new Promise<U>((resolve) => {
    id = setTimeout(() => resolve(value!), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(id));
}

const genieTimeoutMs = 2500;

function PostcardButton({ className, ...props }: ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      className={cn(
        'rounded-full bg-stone-300/80 px-4 py-1 font-[monospace] text-xs uppercase text-stone-600 outline-offset-2 transition-opacity duration-200 group-hover:opacity-100 hover:bg-stone-200 focus-visible:bg-stone-200 focus-visible:opacity-100 focus-visible:outline-dashed focus-visible:outline-1 focus-visible:outline-stone-500 disabled:cursor-not-allowed hoverable:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

const submitMessageAnimationProps = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 10,
  },
  transition: {
    duration: 0.2,
  },
};

export default function FeedbackDialog({ containerRef, trigger }: Props) {
  const isMobileSmall = useMatchMedia('(max-width: 639px)', false);
  const prefersReduced = useReducedMotion();

  const [state, setState] = useState<{
    isOpen: boolean;
    isRevealed: boolean;
  }>({
    isOpen: false,
    isRevealed: false,
  });

  const updateState = useCallback((update: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...update }));
  }, []);

  const genieAnimationRef = useRef<GenieAnimationController>(null);
  const postcardSideRef = useRef<HTMLElement | null>(null);
  const postcardImgRef = useRef<HTMLDivElement | null>(null);
  const postcardFormRef = useRef<HTMLFormElement | null>(null);
  const isPlayingRef = useRef(false);

  const [submitState, setSubmitState] = useState<'initial' | 'sending' | 'error' | 'success'>(
    'initial',
  );

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      if (isPlayingRef.current) {
        return;
      }

      if (!open) {
        if (!genieAnimationRef.current || prefersReduced) {
          updateState({ isRevealed: false, isOpen: false });
          return;
        }

        isPlayingRef.current = true;

        try {
          await withTimeout(
            genieAnimationRef.current.exit({
              target: postcardSideRef.current,
              onStart: () => {
                updateState({ isRevealed: false });
              },
            }),
            genieTimeoutMs,
          );
        } catch (e) {
          // pass
        } finally {
          updateState({ isOpen: false, isRevealed: false });

          isPlayingRef.current = false;
        }
      }
    },
    [updateState, prefersReduced],
  );

  const handleOpen = useCallback(async () => {
    if (isPlayingRef.current) {
      return;
    }

    flushSync(() => {
      updateState({ isOpen: true, isRevealed: false });
      isPlayingRef.current = true;
    });

    if (!genieAnimationRef.current || prefersReduced) {
      updateState({ isOpen: true, isRevealed: true });
      return;
    }

    try {
      await withTimeout(
        genieAnimationRef.current.enter({
          autoHide: true,
          target: postcardImgRef.current,
        }),
        genieTimeoutMs,
      );
    } catch (e) {
      // pass
    } finally {
      updateState({ isRevealed: true });
      isPlayingRef.current = false;
    }
  }, [updateState, prefersReduced]);

  // todo: add react-query
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const formData = new FormData(e.target as HTMLFormElement);

      setSubmitState('sending');

      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to submit feedback.');
        }

        setSubmitState('success');

        setTimeout(() => {
          handleOpenChange(false);
        }, 2000);
      } catch (e) {
        setSubmitState('error');
        console.error(e);
      }
    },
    [handleOpenChange],
  );

  useEffect(() => {
    if (prefersReduced) {
      return;
    }

    preloadImage(isMobileSmall ? '/stamps/postcard_lg_vertical.png' : '/stamps/postcard_lg.png');
  }, [prefersReduced, isMobileSmall]);

  useEffect(() => {
    if (state.isOpen) {
      preloadImage('/stamps/penny_black.png');
    }
  }, [state.isOpen]);

  return (
    <GenieDialog open={state.isOpen} onOpenChange={handleOpenChange}>
      <GenieDialogPortal container={containerRef.current}>
        <GenieDialogOverlay className="absolute inset-0 z-[60] bg-white/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <GenieBackdrop
            ref={genieAnimationRef}
            className="pointer-events-none absolute inset-0 z-[70]"
          />
        </GenieDialogOverlay>

        <GenieDialogContent
          className={cn('absolute left-1/2 top-1/2 z-[80] -translate-x-1/2 -translate-y-1/2', {
            'opacity-0 transition-all duration-200': !state.isRevealed,
            'opacity-100 transition-all duration-100': state.isRevealed,
          })}
        >
          <FlipCard
            className="h-[450px] max-h-[90vh] w-[320px] max-w-[90vw] sm:h-[400px] sm:w-[550px]"
            onSideChange={(side) => {
              if (side === 'front') {
                postcardSideRef.current = postcardImgRef.current;
              } else {
                postcardSideRef.current = postcardFormRef.current;
              }
            }}
          >
            <FlipCardFront className="group" key="front">
              <div
                ref={(e) => {
                  postcardSideRef.current = e;
                  postcardImgRef.current = e;
                }}
                className="h-full w-full rounded-[2px] border border-stone-200 bg-stone-50 p-2 shadow-sm"
              >
                <Image
                  src={
                    isMobileSmall ? '/stamps/postcard_lg_vertical.png' : '/stamps/postcard_lg.png'
                  }
                  alt="Postcard"
                  className="h-full w-full rounded-[2px] object-cover"
                  width={isMobileSmall ? 300 : 550}
                  height={isMobileSmall ? 450 : 350}
                  unoptimized
                />
              </div>

              <FlipCardTrigger asChild>
                <PostcardButton className="absolute bottom-8 left-4 sm:bottom-4 sm:left-4">
                  Flip
                </PostcardButton>
              </FlipCardTrigger>
            </FlipCardFront>
            <FlipCardBack className="group" key="back">
              <FeedbackForm
                className="group/form h-full w-full border border-stone-200 shadow-sm"
                ref={postcardFormRef}
                onSubmit={handleSubmit}
                footer={
                  <AnimatePresence mode="wait">
                    {submitState === 'error' || submitState === 'success' ? (
                      <motion.div
                        key={submitState}
                        className={cn(' font-[monospace] text-xs uppercase ', {
                          'text-red-500': submitState === 'error',
                        })}
                        role="alert"
                        aria-live="assertive"
                        {...submitMessageAnimationProps}
                      >
                        {submitState === 'error' ? 'Uh-oh, try again! :(' : 'Thank you! :)'}
                      </motion.div>
                    ) : (
                      <motion.div className="font-[monospace] text-xs uppercase">
                        Buka Studio Production
                      </motion.div>
                    )}
                  </AnimatePresence>
                }
              >
                <PostcardButton
                  type="submit"
                  className="absolute bottom-8 right-4 flex min-w-[60px] justify-center group-invalid/form:pointer-events-none group-invalid/form:opacity-50 sm:bottom-4 sm:right-4"
                  disabled={submitState === 'sending'}
                >
                  {submitState === 'sending' ? (
                    <SpinnerIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    'Send'
                  )}
                </PostcardButton>
              </FeedbackForm>
              <FlipCardTrigger asChild>
                <PostcardButton className="absolute bottom-8 left-4 sm:bottom-4 sm:left-4">
                  Flip
                </PostcardButton>
              </FlipCardTrigger>
            </FlipCardBack>
          </FlipCard>
          <DialogTitle className="sr-only">Stamps Feedback</DialogTitle>
          <DialogDescription className="sr-only">Submit your feedback here</DialogDescription>
        </GenieDialogContent>
      </GenieDialogPortal>

      <GenieDialogTrigger asChild onClick={handleOpen}>
        {trigger}
      </GenieDialogTrigger>
    </GenieDialog>
  );
}
