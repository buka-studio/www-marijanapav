'use client';

import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { StaticImageData } from 'next/image';
import React, { ComponentProps, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { ArrowRightIcon, ExitIcon } from '~/src/components/icons';
import Button from '~/src/components/ui/Button';
import Image from '~/src/components/ui/Image';

import './Gallery.css';

function getTopLayer() {
  return document.querySelector('.top-layer')! as HTMLElement;
}

const GalleryContext = React.createContext((index: number) => {});

export function GalleryTrigger({
  at,
  className,
  children,
  ...props
}: {
  at: number;
  className?: string;
  children?: React.ReactNode;
  props?: ComponentProps<'button'>;
}) {
  const open = useContext(GalleryContext);

  // display: contents currently doesn't receive focus focus https://github.com/whatwg/html/pull/9425 , let's tack on tabIndex to children as a workaround
  const additionalProps = { tabIndex: 0 };

  return (
    <button
      className={clsx('contents [&>*]:hover:brightness-75', className)}
      onClick={() => {
        open(at);
      }}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, additionalProps);
        }
        return child;
      })}
    </button>
  );
}

function getPrevIndex(i: number, length: number) {
  return (i + length - 1) % length;
}

function getNextIndex(i: number, length: number) {
  return (i + 1) % length;
}

// todo: impl infinite slider
function Slider({
  sources,
  index,
  setIndex,
}: {
  sources: string[] | StaticImageData[];
  index: number;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
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
  }, [setIndex]);

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
  }, [setIndex, sources.length]);

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
    <div className="h-full w-full relative">
      <div
        className="flex focus-visible:outline-none overflow-x-auto gap-4 snap snap-mandatory snap-x scrollbar-none h-full"
        ref={scrollAreaRef}
      >
        {sources.map((src, i) => (
          <div
            className="slide w-[90vw] shrink-0 px-3 snap-start h-full focus-visible:outline-none"
            key={i}
            ref={(e) => {
              photoRefs.current.set(e!, { e: e!, i });
            }}
          >
            <Image
              alt=""
              src={src}
              className="w-full h-full object-contain focus-visible:outline-none"
            />
          </div>
        ))}
      </div>
      <div className="header z-[11] fixed top-[-65px] flex py-5 w-full justify-between ">
        <div className="counter">
          {index + 1} / {sources.length}
        </div>
        <Dialog.Close asChild>
          <Button aria-label="Close" iconLeft={<ExitIcon />} />
        </Dialog.Close>
      </div>
      <Button
        onClick={() => setIndex((i) => getPrevIndex(i, sources.length))}
        aria-label="Go to previous slide"
        className="left-0 top-1/2 -translate-y-1/2 fixed"
        iconLeft={<ArrowRightIcon className="rotate-180" />}
      />
      <Button
        onClick={() => setIndex((i) => getNextIndex(i, sources.length))}
        aria-label="Go to next slide"
        className="right-0 top-1/2 -translate-y-1/2 fixed"
        iconLeft={<ArrowRightIcon />}
      />
    </div>
  );
}

export default function GalleryContextProvider({
  sources = [],
  children,
}: {
  sources: string[] | StaticImageData[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const toggle = useCallback((index: number) => {
    setOpen((o) => !o);
    setIndex(index);
  }, []);

  return (
    <GalleryContext.Provider value={toggle}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal container={getTopLayer()}>
          <Dialog.Overlay className="gallery-overlay bg-neutral-900 inset-0 fixed z-20 backdrop-blur [.theme-light_&]:bg-white [.theme-dark_&]:bg-neutral-950 [.theme-dark_&]:bg-opacity-80 [.theme-light_&]:bg-opacity-80" />
          <Dialog.Content
            className="gallery-content pointer-events-none
          h-[calc(calc(var(--vh,1vh)*90)-85px)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] z-[21] fixed focus-visible:outline-none"
          >
            <Slider sources={sources} index={index} setIndex={setIndex} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </GalleryContext.Provider>
  );
}
