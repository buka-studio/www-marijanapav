'use client';

import { Info as InfoIcon } from '@phosphor-icons/react';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  DrawerTrigger,
} from '~/src/components/ui/Drawer';

import CollectionsList from './components/CollectionsList';
import Description from './components/Description';
import Header from './components/Header';
import MetadataTable from './components/MetadataTable';
import Stamps from './components/Stamps';
import SlideButton from './components/Stamps/SlideButton';
import ZoomButton from './components/Stamps/ZoomButton';
import { useZoomStore } from './components/zoomStore';
import { CollectionType } from './constants';
import { Stamp } from './models';

import './page.css';

export default function Page() {
  const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);
  const zoom = useZoomStore();
  const [collection, setCollection] = useState<CollectionType>('typographic');

  return (
    <div className="grid h-screen w-screen grid-cols-1 grid-rows-[auto_1fr] gap-10 bg-stone-200 p-5 lg:p-20 lg:pb-10 xl:grid-cols-[minmax(auto,580px)_1fr]">
      <Header className="col-[1] row-[1]" />
      <div className="col-[1] row-[2] hidden overflow-auto xl:flex">
        <div className="flex flex-col gap-9">
          <Description selectedStamp={selectedStamp} className="" />

          {selectedStamp && <MetadataTable stamp={selectedStamp} />}
        </div>
      </div>
      <div className="relative col-[1] row-[2] xl:col-[2] xl:row-[1/3]">
        <div className="absolute left-0 top-0 z-10">
          <CollectionsList
            collection={collection}
            onCollectionClick={(c) => {
              setCollection(c);
              setSelectedStamp(null);
              zoom.reset();
            }}
          />
        </div>
        <div className="absolute right-0 top-0 z-10 flex flex-col gap-2">
          <ZoomButton />
          <Drawer
            onOpenChange={(open) => {
              if (open) {
                zoom.setZoomed(false);
              }
            }}
          >
            <AnimatePresence>
              <DrawerTrigger
                className="absolute right-[100px] rounded-full p-2 transition-colors duration-200 hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none"
                asChild
              >
                {selectedStamp && (
                  <SlideButton>
                    <InfoIcon className=" h-5 w-5" />
                  </SlideButton>
                )}
              </DrawerTrigger>
            </AnimatePresence>

            <DrawerContent
              className="max-w-[100vw] border-transparent bg-stone-100/80 backdrop-blur-lg [&_.drawer-handle]:bg-stone-400"
              overlay={<DrawerOverlay className="bg-black/60" />}
            >
              <div>
                <DrawerHeader>
                  <DrawerTitle>{selectedStamp?.title || 'Stamp 1'}</DrawerTitle>
                  <DrawerDescription>{selectedStamp?.country || ''}</DrawerDescription>
                </DrawerHeader>
                <div className="max-w-[100vw] p-5">
                  {selectedStamp && <MetadataTable stamp={selectedStamp} />}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        <Stamps
          onSelect={setSelectedStamp}
          selectedStamp={selectedStamp}
          key={collection}
          className="col-[1] row-[2] xl:col-[2] xl:row-[1/3] "
          collection={collection}
        />
      </div>
    </div>
  );
}
