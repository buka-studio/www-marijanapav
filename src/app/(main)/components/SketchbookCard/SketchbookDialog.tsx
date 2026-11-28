'use client';

import { XIcon } from '@phosphor-icons/react';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  type DialogController,
} from '@ui-sdk/react/dialog';
import { useState } from 'react';

import { BookScroller, createBookController } from '~/src/components/page-turner';
import { leafCount, turnedFor } from '~/src/components/page-turner/core';
import Button from '~/src/components/ui/Button';
import useInputSource from '~/src/hooks/useInputSource';

import Flight from './Flight';
import type RestingBook from './RestingBook';
import Sketchbook from './Sketchbook';
import { clamp } from './ways';

function measureCanvasBleed(slot: HTMLDivElement) {
  const measure = () => {
    const style = getComputedStyle(slot);
    const px = (name: string) => parseFloat(style.getPropertyValue(name));
    const page = px('--sketchbook-page');
    if (!(page > 0)) {
      return;
    }

    const inline = clamp(px('--sketchbook-room-inline') / page, 0.06, 0.6);
    const block = clamp(px('--sketchbook-room-block') / page, 0.2, 1.6);
    slot.style.setProperty('--sketchbook-bleed-inline', String(inline));
    slot.style.setProperty('--sketchbook-bleed-block', String(block));
  };

  measure();
  window.addEventListener('resize', measure);

  return () => window.removeEventListener('resize', measure);
}

type Props = {
  bookmark: number;
  onBookmarkChange: (page: number) => void;
  rest: RestingBook;
  controller: DialogController;
};

export default function SketchbookDialog({
  bookmark,
  onBookmarkChange,
  rest,
  controller: dialog,
}: Props) {
  const [controller] = useState(() => createBookController());
  useInputSource();

  const columns = () => controller.getColumns() ?? 2;

  const leaves = (shown = controller.getPage()) => ({
    turned: turnedFor(shown, columns()),
    count: leafCount(controller.getPageCount() ?? 0, columns()),
  });

  const [flight] = useState(
    () =>
      new Flight({
        way: 'lifted',
        from: () => rest.element,
        canLeave: () => !rest.isRising,
        open: () => controller.goToBookmark(),
        shut: () => {
          const { turned } = leaves();
          controller.first();

          return turned;
        },
        last: () => controller.last(),
        front: () => controller.first({ instant: true }),
        columns,
        away: (away) => (away ? rest.leave() : rest.land()),
      }),
  );

  return (
    <Dialog
      controller={dialog}
      onOpenChange={(open) => {
        if (open) {
          flight.out();
          return;
        }

        const closedBeforeLeaving = !rest.isAway;
        if (closedBeforeLeaving) {
          rest.lower();
        }
        flight.back();
      }}
    >
      <DialogBackdrop ref={flight.fade} className="sketchbook-backdrop" />
      <DialogContent
        className="sketchbook-modal"
        initialFocus='[data-slot="book-pages"]'
        finalFocus={() => rest.button}
      >
        <DialogTitle className="sr-only">Sketchbook</DialogTitle>
        <DialogDescription className="sr-only">
          A sketchbook. Drag a page or press the arrow keys to turn it.
        </DialogDescription>

        <BookScroller
          className="sketchbook-scroller"
          onClick={(event) => {
            const besideTheBook = !(event.target as Element).closest('.sketchbook-flyer');
            if (besideTheBook) {
              dialog.close();
            }
          }}
        >
          <div ref={measureCanvasBleed} className="sketchbook-slot">
            <div ref={flight.bind} className="sketchbook-flyer">
              <div data-flight="spinner" className="sketchbook-spinner">
                <Sketchbook
                  controller={controller}
                  bookmark={bookmark}
                  onBookmarkChange={onBookmarkChange}
                  onPageChange={(next) => {
                    const { turned, count } = leaves(next);
                    flight.turnedTo(turned, count);
                  }}
                />

                <div data-flight="solid" className="sketchbook-solid" aria-hidden="true">
                  <div className="sketchbook-back" />
                  <div className="sketchbook-spine" />
                  <div className="sketchbook-edge" />
                  <div className="sketchbook-head" />
                  <div className="sketchbook-tail" />
                </div>
              </div>
            </div>
          </div>
        </BookScroller>

        <div ref={flight.fade} className="sketchbook-close">
          <DialogClose
            render={
              <Button
                aria-label="Close"
                buttonClassName="p-3"
                iconLeft={<XIcon className="h-5 w-5" aria-hidden="true" />}
              />
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
