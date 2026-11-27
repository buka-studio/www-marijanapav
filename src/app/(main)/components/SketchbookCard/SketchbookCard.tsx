'use client';

import { ArrowsOutSimpleIcon } from '@phosphor-icons/react';
import type { DialogController } from '@ui-sdk/react/dialog';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import GridBackground from '~/src/components/GridBackground';
import CardTitle from '~/src/components/ui/CardTitle';
import useLocalStorage from '~/src/hooks/useLocalStorage';

import Card from '../Card';
import { defaultBookmark, isPage } from './pages';

import './SketchbookCard.css';

const SketchbookAtRest = dynamic(() => import('./Sketchbook').then((m) => m.SketchbookAtRest), {
  ssr: false,
});
const SketchbookDialog = dynamic(() => import('./SketchbookDialog'), { ssr: false });

export default function SketchbookCard() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
  const [dialog, setDialog] = useState<DialogController>();
  const [bookmark, setBookmark] = useLocalStorage('sketchbook-bookmark', defaultBookmark, isPage);

  // the book, its dialog and its canvas are only fetched and made once the card is near the window
  useEffect(() => {
    const node = sceneRef.current;
    if (!node) {
      return;
    }

    let mounted = true;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }
        observer.disconnect();
        void import('@ui-sdk/react/dialog').then(({ createDialogController }) => {
          if (mounted) {
            setDialog(createDialogController());
          }
        });
      },
      { rootMargin: '100%' },
    );
    observer.observe(node);

    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, []);

  return (
    <Card id="sketchbook" containerClassName="sketchbook-card">
      <div className="flex h-full w-full flex-col gap-3">
        <div className="flex min-h-6 items-center justify-between gap-2">
          <CardTitle variant="mono">Sketchbook</CardTitle>
          {/* pointer only: the cover below is the same button, and the one the keyboard reaches */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="group rounded-full"
            onClick={() => dialog?.open()}
          >
            <ArrowsOutSimpleIcon className="text-text-primary group-hover:text-theme-1 h-4 w-4 transition-all duration-200" />
          </button>
        </div>
        {/* overflow-clip, not hidden: a box that hides its overflow scrolls to whatever takes focus in it */}
        <div
          ref={sceneRef}
          className="sketchbook-scene relative grid h-full min-h-[300px] w-full place-items-center overflow-clip"
        >
          <GridBackground className="absolute top-0 left-0 h-full w-full" n={300} />
          {dialog && <SketchbookAtRest ref={restRef} opens={dialog} bookmark={bookmark} />}
        </div>
      </div>
      {dialog && (
        <SketchbookDialog
          bookmark={bookmark}
          onBookmarkChange={setBookmark}
          lifted={restRef}
          controller={dialog}
        />
      )}
    </Card>
  );
}
