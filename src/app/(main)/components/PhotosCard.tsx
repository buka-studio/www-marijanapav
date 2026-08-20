'use client';

import { useEffect, useRef, useState } from 'react';

import CardTitle from '~/src/components/ui/CardTitle';
import Image from '~/src/components/ui/Image';
import { cn } from '~/src/util';

import Card from './Card';
import { photos } from './photos';

const slideDurationMs = 5000;

export default function PhotosCard() {
  const [photo, setPhoto] = useState(0);
  const photoRefs = useRef(new Map<Element, { e: Element; i: number }>());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let visible: Element;

        for (const e of entries) {
          if (e.isIntersecting) {
            visible = e.target;
          }
        }

        const nextI = photoRefs.current.get(visible!)?.i;
        if (nextI === undefined) {
          return;
        }

        timeoutRef.current && clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (nextI !== undefined) {
            setPhoto(nextI);
          }
        }, 500);
      },
      {
        root: scrollAreaRef.current,
        threshold: 0.5,
      },
    );

    for (const [e] of photoRefs.current) {
      if (e instanceof Element) {
        observer?.observe(e);
      }
    }
  }, []);

  useEffect(() => {
    intervalRef.current && clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setPhoto((p) => (p + 1) % photos.length);

      const nextI = (photo + 1) % photos.length;

      scrollAreaRef.current?.scrollTo({
        left: scrollAreaRef.current.clientWidth * nextI,
        behavior: nextI === 0 ? 'auto' : 'smooth',
      });
    }, slideDurationMs);
  }, [photo]);

  return (
    <Card className="flex flex-col gap-5 ">
      <div className="flex flex-col items-start justify-between gap-2 xxs:flex-row xxs:items-center">
        <CardTitle variant="mono">Camera roll</CardTitle>
        <div className="flex items-center justify-center gap-[6px]">
          {photos.map((p, i) => (
            <button
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => {
                setPhoto(i);
                scrollAreaRef.current!.scroll({
                  left: scrollAreaRef.current!.clientWidth * i,
                  behavior: 'smooth',
                });
              }}
              key={p.src}
              className={cn('h-[10px] rounded-full transition-all duration-150', {
                'w-[10px] bg-panel-overlay': i !== photo,
                'h-[6px] w-[30px] bg-theme-1': i === photo,
              })}
            />
          ))}
        </div>
      </div>

      <div
        className="flex aspect-square w-full snap-x snap-mandatory gap-4 overflow-x-auto rounded-md scrollbar-none"
        ref={scrollAreaRef}
      >
        {photos.map((p, i) => (
          <div
            className="relative aspect-square h-full snap-start"
            key={p.src}
            ref={(e) => {
              photoRefs.current.set(e!, { e: e!, i });
            }}
          >
            <Image
              src={p}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px): 50vw, 478px"
              className="rounded-sm object-cover object-center"
            />
            <div className="absolute left-0 top-0 h-full w-full rounded-sm bg-panel-overlay transition-colors duration-200" />
          </div>
        ))}
      </div>
    </Card>
  );
}
