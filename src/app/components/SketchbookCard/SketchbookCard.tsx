'use client';

import { AnimatePresence } from 'framer-motion';
import { useRef, useState } from 'react';

import GridBackground from '~/src/components/GridBackground';
import Button from '~/src/components/ui/Button';
import CardTitle from '~/src/components/ui/CardTitle';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/src/components/ui/Tooltip';

import Card from '../Card';
import DrawingPad, { DrawingPadRef } from './DrawingPad';
import { SketchbookState } from './models';
import Screenshot, { ScreenshotRef } from './Screenshot';
import SketchbookButton from './SketchbookButton';
import Sketchbooks from './Sketchbooks';

type Formats = 'svg' | 'png';

export default function SketchbookCard() {
  const [state, setState] = useState<SketchbookState>('initial');
  const [hasDrawn, setHasDrawn] = useState(false);
  const drawingPadRef = useRef<DrawingPadRef | null>(null);
  const screenshotRef = useRef<ScreenshotRef | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const formats: Formats[] = ['svg'];

  const [sending, setSending] = useState(false);

  // todo: add react-query
  const handleSend = async () => {
    if (sending) {
      return;
    }

    try {
      setSending(true);

      const paths = drawingPadRef.current?.getPaths();
      const svg = drawingPadRef.current?.getSVG();

      if (!paths) {
        throw new Error('No paths found');
      }

      // screenshot returns a blob in case we want to store pngs too
      const blob = await screenshotRef.current?.screenshot(paths, {
        width: containerRef!.current!.clientWidth,
        height: containerRef!.current!.clientHeight,
      });

      const formData = new FormData();
      if (formats.includes('png')) {
        if (!blob) {
          throw new Error('Could not generate png screenshot.');
        }
        formData.append('png', blob!, 'screenshot.png');
      }
      if (formats.includes('svg')) {
        if (!svg) {
          throw new Error('Could not generate svg screenshot.');
        }
        formData.append('svg', new Blob([svg!], { type: 'image/svg+xml' }), 'screenshot.svg');
      }

      const response = await fetch('/api/sketches', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload screenshot.');
      }

      setSending(false);

      setState('sent');
      screenshotRef.current?.exit({ success: true });
      setTimeout(() => {
        setState('initial');
        setHasDrawn(false);
      }, 2000);
    } catch (error) {
      setSending(false);
      setState('error');
      screenshotRef.current?.exit({ success: false });

      console.error(error);
      setTimeout(() => {
        setState('drawing');
      }, 2000);
    }
  };

  return (
    <Card id="sketchbook">
      <div className="flex h-full w-full flex-col gap-3 overflow-hidden">
        <div className="relative h-full min-h-[300px] w-full overflow-hidden" ref={containerRef}>
          <GridBackground className="absolute left-0 top-0 h-full w-full" n={300} />
          <AnimatePresence mode="wait">
            {state === 'initial' ? (
              <Sketchbooks count={10} className="group" key="sketchbooks">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-all duration-200 focus-within:opacity-100 group-hover:opacity-100">
                  <Tooltip>
                    <Button buttonClassName="gap-2" asChild>
                      <TooltipTrigger onClick={() => setState('drawing')}>
                        Coming soon
                      </TooltipTrigger>
                    </Button>
                    <TooltipContent className="w-[200px] text-center">
                      In the meantime, you can draw something here!
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Sketchbooks>
            ) : (
              <DrawingPad
                key="drawing-pad"
                drawingPadRef={drawingPadRef}
                onDraw={setHasDrawn}
                onClear={() => setHasDrawn(false)}
                onCancel={() => {
                  setState('initial');
                }}
              />
            )}
          </AnimatePresence>
          <Screenshot screenshotRef={screenshotRef} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <CardTitle variant="mono">Sketchbook</CardTitle>
          <SketchbookButton
            hasDrawn={hasDrawn}
            state={state}
            onClick={() => {
              if (state === 'initial') {
                setState('drawing');
              }
              if (state === 'drawing') {
                setState('sending');
                handleSend();
              }
            }}
          />
        </div>
      </div>
    </Card>
  );
}
