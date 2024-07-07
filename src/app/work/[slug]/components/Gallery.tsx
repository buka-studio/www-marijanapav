'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { StaticImageData } from 'next/image';
import React, { ComponentProps, useCallback, useContext, useState } from 'react';

import { cn } from '~/src/util';

import './Gallery.css';

function getTopLayer() {
  return typeof window !== 'undefined'
    ? (document.querySelector('.top-layer')! as HTMLElement)
    : null;
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
      className={cn('contents [&>*]:hover:brightness-75', className)}
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
          <Dialog.Overlay className="gallery-overlay fixed inset-0 z-20 bg-neutral-900 backdrop-blur [.theme-dark_&]:bg-neutral-950 [.theme-dark_&]:bg-opacity-80 [.theme-light_&]:bg-white [.theme-light_&]:bg-opacity-80" />
          <Dialog.Content
            className="gallery-content pointer-events-none
          fixed left-1/2 top-1/2 z-[21] h-[calc(calc(var(--vh,1vh)*90)-85px)] w-[90vw] max-w-screen-2xl -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
          >
            {/* <Slider sources={sources} index={index} setIndex={setIndex} /> */}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </GalleryContext.Provider>
  );
}
