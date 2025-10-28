'use client';

import { MotionProps } from 'framer-motion';
import { useEffect, useState } from 'react';

import ClientRendered from '~/src/components/ClientRendered';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '~/src/components/ui/Drawer';
import useMatchMedia from '~/src/hooks/useMatchMedia';
import { cn } from '~/src/util';

import Description from './components/Description';
import Noise from './components/Noise';
import Stamps from './components/Stamps/Stamps';

import './page.css';

const snapPoints = [0.2, 1];

const desktopStampsProps: MotionProps = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 },
};

export default function Page() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  const isMobile = useMatchMedia('(max-width: 1024px)');
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(true);
    }
  }, [isMobile]);

  return (
    <div
      className={cn(
        'stamps-page grain grid min-h-[100svh] grid-cols-1 grid-rows-[auto_auto] gap-10 overflow-clip bg-stone-100 lg:h-screen lg:max-h-screen lg:grid-cols-[minmax(auto,675px)_1fr] lg:grid-rows-1 lg:pl-10',
      )}
    >
      <Description className="max-w-xl px-4 pt-4 lg:pt-5" />
      <ClientRendered>
        {isMobile ? (
          <Drawer
            open={drawerOpen}
            dismissible={false}
            autoFocus={false}
            onOpenChange={setDrawerOpen}
            snapPoints={snapPoints}
            activeSnapPoint={snap}
            setActiveSnapPoint={setSnap}
          >
            <DrawerContent
              overlayClassName="!opacity-0"
              handle={false}
              className="!rounded-none !border-none bg-stone-100 shadow-[0_-2px_10px_0_rgba(0,0,0,0.05),0_-1px_6px_0_rgba(0,0,0,0.05)] data-[vaul-drawer-direction=bottom]:max-h-[calc(100svh-46px)] focus-visible:outline-none lg:hidden"
            >
              <DrawerTitle className="sr-only">Stamps</DrawerTitle>
              <DrawerDescription className="sr-only">Drag and explore stamps</DrawerDescription>
              <Stamps className="min-h-[calc(100svh-46px)]" />
            </DrawerContent>
          </Drawer>
        ) : (
          <Stamps
            className="z-[2] col-[1] row-[3] hidden border-l border-stone-300 pr-2 lg:col-[2] lg:row-[1/3] lg:grid lg:min-w-[680px] lg:pr-8"
            {...desktopStampsProps}
          />
        )}
      </ClientRendered>

      <Noise className="pointer-events-none absolute" />
    </div>
  );
}
