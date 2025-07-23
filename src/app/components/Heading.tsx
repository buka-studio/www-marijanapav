'use client';

import { ComponentProps, useEffect, useRef } from 'react';

import HighlightedText, { Controls } from '~/src/components/HighlightedHeading';
import Heading from '~/src/components/ui/Heading';
import { cn } from '~/src/util';

const lines = ['Designer crafting', ' brands and websites', ''];

const staggerMs = 300;

export default function Hheading({ className, ...props }: ComponentProps<'h1'>) {
  const index = useRef(0);
  const textRefs = useRef(new Map<number, Controls>());

  useEffect(() => {
    if (index.current === lines.length) {
      return;
    }
    const interval = setInterval(() => {
      textRefs.current.get(index.current)?.start();
      index.current += 1;
    }, staggerMs);

    return () => {
      clearInterval(interval);
    };
  }, [index]);

  return (
    <Heading className={cn('max-w-[1000px]', className)}>
      {lines.map((l, i) => (
        <HighlightedText
          aria-hidden
          className="font-archivo text-4xl lg:text-8xl"
          ref={(e) => {
            textRefs.current.set(i, e!);
          }}
          key={l}
        >
          {l}
        </HighlightedText>
      ))}
      <span className="sr-only">{lines.join(' ')}</span>
    </Heading>
  );
}
