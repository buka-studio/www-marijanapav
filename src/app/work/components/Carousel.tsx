'use client';

import { StaticImageData } from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

import { ArrowRightIcon } from '~/src/components/icons';
import Button from '~/src/components/ui/Button';
import Image from '~/src/components/ui/Image';
import { cn } from '~/src/util';

function getPrevIndex(i: number, length: number) {
  return (i + length - 1) % length;
}

function getNextIndex(i: number, length: number) {
  return (i + 1) % length;
}

// todo: impl infinite slider
export default function Carousel({
  sources,
  defaultIndex = 0,
  className,
  actions,
}: {
  sources: string[] | StaticImageData[];
  defaultIndex?: number;
  className?: string;
  actions?: React.ReactNode;
}) {
  const [index, setIndex] = useState(defaultIndex);

  const photoRefs = useRef(new Map<Element, { e: Element; i: number }>());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const didFirstScroll = useRef(false);

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
        setIndex(nextI);
      },
      {
        root: scrollAreaRef.current,
        threshold: 1,
      },
    );

    for (const [e] of photoRefs.current) {
      if (e instanceof Element) {
        observer?.observe(e);
      }
    }
  }, []);

  useEffect(() => {
    function handleArrowKeys(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setIndex((i) => getPrevIndex(i, sources.length));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setIndex((i) => getNextIndex(i, sources.length));
      }
    }

    window.addEventListener('keydown', handleArrowKeys);
    return () => window.removeEventListener('keydown', handleArrowKeys);
  }, [sources.length]);

  const prevIndex = useRef(index);
  useEffect(() => {
    if (!scrollAreaRef.current) {
      return;
    }

    const wraparound =
      (index === 0 && prevIndex.current === sources.length - 1) ||
      (prevIndex.current === 0 && index === sources.length - 1);

    scrollAreaRef.current!.scroll({
      left: scrollAreaRef.current!.clientWidth * index,
      behavior: !didFirstScroll.current || wraparound ? 'auto' : 'smooth',
    });

    prevIndex.current = index;
    didFirstScroll.current = true;
  }, [index, sources.length]);

  return (
    <div className={cn('group/card relative h-full w-full', className)}>
      <div className="h-full w-full px-3">
        <div
          className="snap flex h-full snap-x snap-mandatory gap-4 overflow-x-auto rounded-lg scrollbar-none focus-visible:outline-none"
          ref={scrollAreaRef}
        >
          {sources.map((src, i) => (
            <div
              className="slide relative flex h-full w-full shrink-0 snap-center items-center justify-center focus-visible:outline-none"
              key={i}
              ref={(e) => {
                photoRefs.current.set(e!, { e: e!, i });
              }}
            >
              <div className="absolute inset-0">
                <Image
                  quality={90}
                  alt=""
                  src={src}
                  sizes="(max-width: 1360px) 90vw, 1360px"
                  className="h-full w-full rounded-lg object-cover object-center focus-visible:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="header fixed left-5 right-5 top-5 z-[11] flex items-center justify-between">
        <div className="counter rounded-full bg-main-theme-3 px-3 py-1 text-xs opacity-50 transition-opacity duration-200 group-hover/card:opacity-100">
          {index + 1} / {sources.length}
        </div>
        {actions}
      </div>
      {sources.length > 1 && (
        <>
          <Button
            onClick={() => setIndex((i) => getPrevIndex(i, sources.length))}
            disabled={sources.length === 1}
            aria-label="Go to previous slide"
            className="absolute left-5 opacity-50 group-hover/card:opacity-100 focus-visible:opacity-100 [@media(max-height:499px)]:bottom-5 [@media(min-height:500px)]:top-1/2 [@media(min-height:500px)]:-translate-y-1/2"
            iconLeft={<ArrowRightIcon className="rotate-180" />}
          />
          <Button
            onClick={() => setIndex((i) => getNextIndex(i, sources.length))}
            disabled={sources.length === 1}
            aria-label="Go to next slide"
            className="absolute right-5 opacity-50 group-hover/card:opacity-100 focus-visible:opacity-100 [@media(max-height:499px)]:bottom-5 [@media(min-height:500px)]:top-1/2 [@media(min-height:500px)]:-translate-y-1/2"
            iconLeft={<ArrowRightIcon />}
          />
        </>
      )}
    </div>
  );
}
