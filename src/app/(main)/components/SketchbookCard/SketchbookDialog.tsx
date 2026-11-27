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

import Flight from './Flight';
import Sketchbook from './Sketchbook';

function hasRestingBookRisen(rest: HTMLElement | null) {
  const book = rest?.querySelector('.sketchbook-rest-book');
  if (!book) {
    return true;
  }
  const [, sunkBy = '0'] = getComputedStyle(book).translate.split(' ');

  return Math.abs(parseFloat(sunkBy)) < 0.5;
}

const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

function measureCanvasBleed(slot: HTMLDivElement) {
  const measure = () => {
    const style = getComputedStyle(slot);
    const px = (name: string) => parseFloat(style.getPropertyValue(name));
    const page = px('--sketchbook-page');
    if (!(page > 0)) {
      return;
    }

    const inline = clamp(0.06, px('--sketchbook-room-inline') / page, 0.6);
    const block = clamp(0.2, px('--sketchbook-room-block') / page, 1.6);
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
        from: () => lifted.current,
        canLeave: () => hasRestingBookRisen(lifted.current),
        open: () => controller.goToBookmark(),
        shut: () => {
          const { turned } = leaves();
          controller.first();

          return turned;
        },
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
    <Dialog
      controller={dialog}
      onOpenChange={(open, details) => {
        const rest = lifted.current;
        if (!open) {
          const closedBeforeLeaving = !rest?.hasAttribute('data-away');
          if (closedBeforeLeaving) {
            rest?.removeAttribute('data-raised');
          }
          flight.back();
          return;
        }

        const sunk = !hasRestingBookRisen(rest) && !rest?.hasAttribute('data-raised');
        if (sunk) {
          // raise first: the rise runs off the main thread while the dialog mounts on it
          details.cancel();
          rest?.setAttribute('data-raised', '');
          requestAnimationFrame(() => requestAnimationFrame(() => dialog.open()));
          return;
        }

        rest?.setAttribute('data-raised', '');
        flight.out();
      }}
    >
      <DialogBackdrop ref={flight.fade} className="sketchbook-backdrop" />
      <DialogContent
        className="sketchbook-modal"
        initialFocus='[data-slot="book-pages"]'
        finalFocus={() => lifted.current?.querySelector<HTMLElement>('.sketchbook-rest-button')}
      >
        <DialogTitle className="sr-only">Sketchbook</DialogTitle>
        <DialogDescription className="sr-only">
          A sketchbook. Drag a page or press the arrow keys to turn it.
        </DialogDescription>

        <BookScroller
          className="sketchbook-scroller"
          onClick={(event) => {
            const besideTheBook = event.target === event.currentTarget;
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
