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
  blank?: boolean;
};

export default function Sketchbook({ blank, ...props }: SketchbookProps) {
  const themeKey = useThemeKey();
  // ?curl=false: plain folding pages, for testing
  const curls = useSearchParams().get('curl') !== 'false';

  return (
    <Book
      aria-label="Sketchbook"
      renderer={curls ? curl : undefined}
      fallback={curls ? snapshot : undefined}
      className="[--book-page-curve:1] [--book-page-radius:0.032] [--book-paper-grain:1] [--book-paper:#f3f1e8] [--book-thread:#ebe5d4]"
      {...props}
    >
      <BookStage>
        <BookPages>
          <BookPage hard className={coverClassName} data-theme={themeKey}>
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

function useCoverLightWhileMoving() {
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

    const replayPointer = () => {
      frame = moving.getAnimations().length > 0 ? requestAnimationFrame(replayPointer) : 0;
      if (pointer) {
        root.dispatchEvent(new PointerEvent('pointermove', pointer));
      }
    };
    const onTransitionRun = (event: TransitionEvent) => {
      if (event.target === moving && frame === 0) {
        frame = requestAnimationFrame(replayPointer);
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

// measured in js: safari 26 miscomputes tan(atan2()) of two lengths
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
      const coverWidth = widths.get(rest);
      const spreadWidth = widths.get(book);
      if (coverWidth && spreadWidth) {
        const pageWidth = spreadWidth / 2;
        rest.style.setProperty('--rest-scale', String(coverWidth / pageWidth));
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

export function SketchbookAtRest({ ref, opens, bookmark }: SketchbookAtRestProps) {
  const bookRef = useCoverLightWhileMoving();
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
