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
import { useState, type RefObject } from 'react';

import { BookScroller, createBookController } from '~/src/components/page-turner';
import { leafCount, turnedFor } from '~/src/components/page-turner/core';
import Button from '~/src/components/ui/Button';
import useInputSource from '~/src/hooks/useInputSource';

import { createFlight } from './flight';
import Sketchbook from './Sketchbook';

// Keeps the resting sketchbook fully in view, and returns the animations still moving it there.
function raise(rest: HTMLElement | null) {
  rest?.setAttribute('data-raised', '');

  return rest?.querySelector('.sketchbook-rest-book')?.getAnimations() ?? [];
}

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

// How far the book's canvas reaches past its pages, in page widths: as far as the ribbon can be
// pulled, and never past the window's edge. The stylesheet has the lengths (`--sketchbook-room-*`)
// and this divides them, which Safari gets wrong when it is left to `tan(atan2())`.
function reach(slot: HTMLDivElement) {
  const measure = () => {
    const style = getComputedStyle(slot);
    const length = (name: string) => parseFloat(style.getPropertyValue(name));
    const page = length('--sketchbook-page');
    if (!(page > 0)) {
      return;
    }

    const inline = clamp(0.06, length('--sketchbook-room-inline') / page, 0.6);
    const block = clamp(0.2, length('--sketchbook-room-block') / page, 1.6);
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
  // the element `SketchbookAtRest` renders, which the book flies from and back to
  lifted: RefObject<HTMLElement | null>;
  controller: DialogController;
};

export default function SketchbookDialog({
  bookmark,
  onBookmarkChange,
  lifted,
  controller: dialog,
}: Props) {
  const [controller] = useState(() => createBookController());
  // focus rings in the dialog are for the keyboard only
  useInputSource();

  // undefined until the book is mounted, when it will be a spread
  const columns = () => controller.getColumns() ?? 2;

  const leaves = (shown = controller.getPage()) => ({
    turned: turnedFor(shown, columns()),
    count: leafCount(controller.getPageCount() ?? 0, columns()),
  });

  const [flight] = useState(() =>
    createFlight({
      way: 'lifted',
      from: () => lifted.current,
      open: () => controller.goToBookmark(),
      shut: () => {
        const { turned } = leaves();
        controller.first();

        return turned;
      },
      // past the middle, the back cover is the nearer one to shut at
      last: () => controller.last(),
      front: () => controller.first({ instant: true }),
      columns,
      away: (away) => {
        lifted.current?.toggleAttribute('data-away', away);
        if (!away) {
          lifted.current?.removeAttribute('data-raised');
        }
      },
    }),
  );

  return (
    // The dialog closes at once, but its content stays until `flight.back` has flown the book home.
    <Dialog
      controller={dialog}
      onOpenChange={(open, details) => {
        if (!open) {
          flight.back();
          return;
        }

        // The book flies from where the resting one lies in full view. A tap, or a quick click,
        // finds it still sunk or rising, so the dialog waits for it.
        const rising = raise(lifted.current);
        if (rising.length > 0) {
          details.cancel();
          void Promise.allSettled(rising.map((animation) => animation.finished)).then(() =>
            dialog.open(),
          );
          return;
        }

        flight.out();
      }}
    >
      <DialogBackdrop ref={flight.fade} className="sketchbook-backdrop" />
      {/* focus starts on the pages, so the arrow keys turn them, and goes back to the cover: the
          button in the card's header opens the dialog too, and is hidden from the keyboard */}
      <DialogContent
        className="sketchbook-modal"
        initialFocus='[data-slot="book-pages"]'
        finalFocus={() => lifted.current?.querySelector<HTMLElement>('.sketchbook-rest-button')}
      >
        <DialogTitle className="sr-only">Sketchbook</DialogTitle>
        <DialogDescription className="sr-only">
          A sketchbook. Drag a page or press the arrow keys to turn it.
        </DialogDescription>

        {/* on a phone the open book is wider than the window, and scrolls across it */}
        <BookScroller className="sketchbook-scroller">
          <div ref={reach} className="sketchbook-slot">
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

                {/* the back, spine and edges of the book, seen while it flies */}
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
