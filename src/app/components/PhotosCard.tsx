'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

import photo0 from '~/public/home/photos/photo_0.jpg';
import photo1 from '~/public/home/photos/photo_1.jpg';
import photo2 from '~/public/home/photos/photo_2.jpg';
import photo3 from '~/public/home/photos/photo_3.jpg';
import photo4 from '~/public/home/photos/photo_4.jpg';
import photo5 from '~/public/home/photos/photo_5.jpg';
import photo6 from '~/public/home/photos/photo_6.jpg';
import photo7 from '~/public/home/photos/photo_7.jpg';
import photo8 from '~/public/home/photos/photo_8.jpg';
import photo9 from '~/public/home/photos/photo_9.jpg';
import photo10 from '~/public/home/photos/photo_10.jpg';
import photo11 from '~/public/home/photos/photo_11.jpg';
import photo12 from '~/public/home/photos/photo_12.jpg';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';

import Card from './Card';

export const photos = [
  photo0,
  photo1,
  photo2,
  photo3,
  photo4,
  photo5,
  photo6,
  photo7,
  photo8,
  photo9,
  photo10,
  photo11,
  photo12,
];

const slideDurationMs = 5000;

export default function PhotosCard() {
  const [photo, setPhoto] = useState(0);
  const photoRefs = useRef(new Map<Element, { e: Element; i: number }>());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setTimeout>>();

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

        clearTimeout(timeoutRef.current);
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
    clearInterval(intervalRef.current);
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
    <Card className="flex flex-col">
      <div className="mb-6 flex w-full justify-between gap-2 xl:mb-auto">
        <Heading as="h1" className="text-primary font-sans text-text-secondary">
          Bits and pieces from my camera roll
        </Heading>
      </div>
      <div
        className="flex aspect-square w-full snap-x snap-mandatory gap-4 overflow-x-auto rounded-xl scrollbar-none md:order-2 xl:order-none xl:mt-auto"
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
              className="rounded-xl object-cover object-center"
            />
            <div className="absolute left-0 top-0 h-full w-full rounded-xl bg-main-theme-overlay transition-colors duration-200" />
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-[6px] pb-1 md:order-1 md:my-2 md:mt-auto xl:order-last xl:mb-0 xl:mt-5">
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
            className={twMerge(
              clsx('h-[10px] rounded-full transition-all duration-150', {
                ['w-[10px] bg-main-theme-overlay']: i !== photo,
                ['h-[6px] w-[50px] bg-main-theme-1']: i === photo,
              }),
            )}
          />
        ))}
      </div>
    </Card>
  );
}
