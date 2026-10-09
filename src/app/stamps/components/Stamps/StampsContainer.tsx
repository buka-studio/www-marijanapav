'use client';

import { useEffect } from 'react';

import ClientRendered from '~/src/components/ClientRendered';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '~/src/components/ui/Drawer';

import { useStampStore } from '../../store';
import Stamps from './Stamps';
import { useIsMobile } from './util';

export default function StampsContainer() {
  const stampsDrawerOpen = useStampStore((s) => s.stampsDrawerOpen);
  const isMobile = useIsMobile();

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const onChange = () => useStampStore.getState().deselectStamp();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <ClientRendered>
      {isMobile ? (
        <Drawer
          open={stampsDrawerOpen}
          onOpenChange={(open) => useStampStore.getState().setStampsDrawerOpen(open)}
          autoFocus={false}
          shouldScaleBackground={false}
        >
          <DrawerContent
            overlayClassName="opacity-0!"
            handle={false}
            className="rounded-none! border-none! bg-stone-100 shadow-[0_-2px_10px_0_rgba(0,0,0,0.05),0_-1px_6px_0_rgba(0,0,0,0.05)] focus-visible:outline-none data-[vaul-drawer-direction=bottom]:max-h-[calc(100svh-46px)] lg:hidden"
          >
            <DrawerTitle className="sr-only">Stamps</DrawerTitle>
            <DrawerDescription className="sr-only">Drag and explore stamps</DrawerDescription>
            <Stamps className="min-h-[calc(100svh-46px)]" />
          </DrawerContent>
        </Drawer>
      ) : (
        <Stamps className="z-2 col-1 hidden border-l border-stone-300 pr-2 lg:col-2 lg:grid lg:min-w-[680px] lg:pr-8" />
      )}
    </ClientRendered>
  );
}
