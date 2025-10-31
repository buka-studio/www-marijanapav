'use client';

import { MotionProps } from 'framer-motion';
import { useEffect, useState } from 'react';

import ClientRendered from '~/src/components/ClientRendered';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '~/src/components/ui/Drawer';
import useMatchMedia from '~/src/hooks/useMatchMedia';

import StampCollection from './StampCollection';

export default function Stamps() {
  const snapPoints = [0.2, 1];

  const desktopStampsProps: MotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  };

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snap, setSnap] = useState<number | string | null>(snapPoints[0]);

  const isMobile = useMatchMedia('(max-width: 1024px)');
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(true);
    }
  }, [isMobile]);

  return (
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
            <StampCollection className="min-h-[calc(100svh-46px)]" />
          </DrawerContent>
        </Drawer>
      ) : (
        <StampCollection
          className="z-[2] col-[1] hidden border-l border-stone-300 pr-2 lg:col-[2] lg:grid lg:min-w-[680px] lg:pr-8"
          {...desktopStampsProps}
        />
      )}
    </ClientRendered>
  );
}
