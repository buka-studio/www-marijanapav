'use client';

import {
  MagnifyingGlassMinus as MagnifyingGlassMinusIcon,
  MagnifyingGlassPlus as MagnifyingGlassPlusIcon,
} from '@phosphor-icons/react';
import { AnimatePresence } from 'framer-motion';

import { useZoomStore } from '../zoomStore';
import SlideButton from './SlideButton';

export default function ZoomButton({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { zoomed, setZoomed, zoomable } = useZoomStore();

  return (
    <AnimatePresence mode="wait">
      {zoomable && zoomed && (
        <SlideButton onClick={() => setZoomed(!zoomed)} key="zoomed">
          <MagnifyingGlassMinusIcon className="h-5 w-5" />
        </SlideButton>
      )}
      {zoomable && !zoomed && (
        <SlideButton onClick={() => setZoomed(!zoomed)} key="zoomed-out">
          <MagnifyingGlassPlusIcon className="h-5 w-5" />
        </SlideButton>
      )}
    </AnimatePresence>
  );
}
