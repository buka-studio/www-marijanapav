'use client';

import { DialogTrigger, type DialogController } from '@ui-sdk/react/dialog';
import { useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, type Ref, type RefObject } from 'react';

import {
  Book,
  BookPage,
  BookPages,
  BookRibbon,
  BookRibbonMark,
  BookStage,
  type BookProps,
} from '~/src/components/page-turner';
import { curl } from '~/src/components/page-turner/curl';
import { snapshot } from '~/src/components/page-turner/snapshot';
import useThemeKey from '~/src/hooks/useThemeKey';

import { sketchPages } from './pages';
import SketchbookPocket from './SketchbookPocket';

import '~/src/components/page-turner/styles.css';
import '~/src/components/page-turner/controls.css';

const coverClassName =
  'grid place-items-center bg-(--sketchbook-board) font-libertinus text-[9cqw] text-(--sketchbook-board-ink) [--book-cover-deboss:1] [--book-cover-leather:var(--sketchbook-leather)] [--book-cover-sheen:var(--sketchbook-sheen)]';

type SketchbookProps = Omit<BookProps, 'children' | 'className'> & {
  // empty pages, for a sketchbook that is only ever seen shut
  blank?: boolean;
};

export default function Sketchbook({ blank, ...props }: SketchbookProps) {
  // The book reads its colours once. Remounting it for a new theme is slow, so instead `data-theme`
  // makes it redraw the covers, and only the ribbon is remounted.
  const themeKey = useThemeKey();
  // for testing: `?curl=false` leaves the pages folding, drawn by neither canvas renderer
  const curls = useSearchParams().get('curl') !== 'false';

  return (
    <Book
      aria-label="Sketchbook"
      renderer={curls ? curl : undefined}
      fallback={curls ? snapshot : undefined}
      className="[--book-page-radius:0.032] [--book-paper-grain:1] [--book-paper:#f3f1e8]"
      {...props}
    >
      <BookStage>
        <BookPages>
          <BookPage hard className={coverClassName} data-theme={themeKey}>
            {/* text is only debossed in an element of its own */}
            <span>Sketchbook</span>
          </BookPage>
          <BookPage />
          {sketchPages.map((page) => (
            <BookPage key={page} className="flex items-end justify-center p-[7cqw]">
              {!blank && (
                <span className="font-mono text-[3.4cqw] tracking-widest opacity-50">
                  {String(page).padStart(2, '0')}
                </span>
              )}
            </BookPage>
          ))}
          <BookPage markable={false}>{!blank && <SketchbookPocket />}</BookPage>
          <BookPage hard className={coverClassName} data-theme={themeKey}>
            <span className="self-end pb-[8cqw] font-sans text-[3cqw] font-medium tracking-[0.2em] uppercase">
              Moleskine
            </span>
          </BookPage>
        </BookPages>
        <BookRibbon key={themeKey} className="sketchbook-ribbon" />
        <BookRibbonMark className="sketchbook-ribbon-mark" />
      </BookStage>
    </Book>
  );
}

// The book only re-aims the light on its cover when the pointer moves. The resting book moves under
// a still pointer as it rises and sinks, so the last pointer position is replayed while it does.
function useLightWhileMoving() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moving = ref.current;
    if (!moving) {
      return;
    }

    const root = document.documentElement;
    let pointer: PointerEventInit | undefined;
    let frame = 0;

    const onPointerMove = ({ isTrusted, clientX, clientY, pointerType }: PointerEvent) => {
      if (isTrusted) {
        pointer = pointerType === 'touch' ? undefined : { clientX, clientY, pointerType };
      }
    };
    const onPointerGone = () => {
      pointer = undefined;
    };

    const tell = () => {
      // one more frame after it stops, for where it came to rest
      frame = moving.getAnimations().length > 0 ? requestAnimationFrame(tell) : 0;
      if (pointer) {
        root.dispatchEvent(new PointerEvent('pointermove', pointer));
      }
    };
    const onTransitionRun = (event: TransitionEvent) => {
      if (event.target === moving && frame === 0) {
        frame = requestAnimationFrame(tell);
      }
    };

    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerleave', onPointerGone);
    moving.addEventListener('transitionrun', onTransitionRun);

    return () => {
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerGone);
      moving.removeEventListener('transitionrun', onTransitionRun);
      cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

// Scales the resting book so that a page of it is as wide as the box it lies in. Measured, not
// left to the stylesheet: Safari gets one length divided by another, `tan(atan2())`, wrong.
function useRestScale(bookRef: RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const book = bookRef.current;
    const rest = book?.parentElement;
    if (!book || !rest) {
      return;
    }

    const widths = new Map<Element, number>();
    const observer = new ResizeObserver((entries) => {
      entries.forEach((entry) => widths.set(entry.target, entry.borderBoxSize[0].inlineSize));
      const cover = widths.get(rest);
      const spread = widths.get(book);
      if (cover && spread) {
        // a spread is two pages wide
        rest.style.setProperty('--rest-scale', String(cover / (spread / 2)));
      }
    });
    observer.observe(rest);
    observer.observe(book);

    return () => {
      observer.disconnect();
      rest.style.removeProperty('--rest-scale');
    };
  }, [bookRef]);
}

type SketchbookAtRestProps = {
  ref?: Ref<HTMLDivElement>;
  opens: DialogController;
  bookmark: number;
};

// The shut sketchbook on the card, which the one in the dialog is lifted from. It is a picture:
// the button over its cover is what opens the dialog.
export function SketchbookAtRest({ ref, opens, bookmark }: SketchbookAtRestProps) {
  const bookRef = useLightWhileMoving();
  useRestScale(bookRef);

  return (
    <div ref={ref} className="sketchbook-rest">
      <div ref={bookRef} className="sketchbook-rest-book" inert aria-hidden="true">
        <Sketchbook blank drag={false} bookmark={bookmark} />
      </div>
      <DialogTrigger
        controller={opens}
        className="sketchbook-rest-button"
        aria-label="Open sketchbook"
      />
    </div>
  );
}
