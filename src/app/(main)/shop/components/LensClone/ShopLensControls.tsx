'use client';

import { MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { cn, supportsHtmlInCanvas } from '~/src/util';

import LensDialRoot from './LensDialRoot';

const DynamicLensClone = dynamic(() => import('./LensClone'), {
  ssr: false,
});

export default function ShopLensControls() {
  const [isSupported, setIsSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setIsSupported(supportsHtmlInCanvas());
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none fixed bottom-16 left-1/2 z-12 translate-x-[120px] md:bottom-20">
        <div className="pointer-events-auto">
          <button
            type="button"
            aria-pressed={enabled}
            aria-label={enabled ? 'Disable magnifier' : 'Enable magnifier'}
            onClick={() => setEnabled((current) => !current)}
            className="border-panel-border bg-panel-background shadow-card rounded-full border p-1 transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-theme-1 active:scale-95"
          >
            <span
              className={cn(
                'text-text-primary flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-150',
                {
                  'bg-theme-3': enabled,
                  'bg-transparent': !enabled,
                },
              )}
            >
              {enabled ? (
                <MagnifyingGlassMinusIcon className="h-5 w-5" />
              ) : (
                <MagnifyingGlassPlusIcon className="h-5 w-5" />
              )}
            </span>
          </button>
        </div>
      </div>
      {enabled && (
        <>
          <DynamicLensClone cloneSelector="[data-lens-root]" />
          <LensDialRoot />
        </>
      )}
    </>
  );
}
