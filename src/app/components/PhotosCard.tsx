'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

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
    <Card className="">
      <div className="mb-[66px] flex gap-2 justify-between w-full">
        <Heading as="h1" className="text-primary text-text-secondary font-sans">
          Bits and pieces from my camera roll
        </Heading>
      </div>
      <div
        className="flex aspect-square w-full rounded-xl overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-none"
        ref={scrollAreaRef}
      >
        {photos.map((p, i) => (
          <div
            className="h-full aspect-square relative snap-start"
            key={p.src}
            ref={(e) => {
              photoRefs.current.set(e!, { e: e!, i });
            }}
          >
            <Image
              src={p}
              alt=""
              fill
              sizes="478px"
              className="object-cover object-center rounded-xl"
            />
            <div className="transition-colors duration-200 rounded-xl bg-main-theme-overlay absolute h-full w-full top-0 left-0" />
          </div>
        ))}
      </div>
      <div className="flex gap-[6px] pt-5 pb-1 justify-center">
        {photos.map((p, i) => (
          <button
            aria-label=""
            onClick={() => {
              setPhoto(i);
              scrollAreaRef.current!.scroll({
                left: scrollAreaRef.current!.clientWidth * i,
                behavior: 'smooth',
              });
            }}
            key={p.src}
            className={clsx('h-[6px]  rounded-full transition-all duration-150', {
              ['bg-main-theme-overlay w-[16px]']: i !== photo,
              ['w-[50px] bg-main-theme-1']: i === photo,
            })}
          ></button>
        ))}
      </div>
    </Card>
  );
}
