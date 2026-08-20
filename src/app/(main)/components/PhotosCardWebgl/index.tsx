'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import CardTitle from '~/src/components/ui/CardTitle';
import { cn } from '~/src/util';

import Card from '../Card';
import { photos } from '../photos';
import type { PhotoDistortParams } from './params';
import PhotoPlaceholder from './PhotoPlaceholder';

function PhotosCardWebglFallback() {
  return (
    <Card className="flex flex-col gap-5">
      <div className="xxs:flex-row xxs:items-center flex flex-col items-start justify-between gap-2">
        <CardTitle variant="mono">Camera roll</CardTitle>
        <div className="flex items-center justify-center gap-[6px]" aria-hidden>
          {photos.map((item, index) => (
            <div
              key={item.src}
              className={cn('h-[10px] rounded-full', {
                'bg-panel-overlay w-[10px]': index !== 0,
                'bg-theme-1 h-[6px] w-[30px]': index === 0,
              })}
            />
          ))}
        </div>
      </div>
      <div className="relative aspect-square w-full rounded-md">
        <PhotoPlaceholder />
      </div>
    </Card>
  );
}

const PhotosCardWebglLazy = dynamic(() => import('./WebglCard'), {
  ssr: false,
  loading: PhotosCardWebglFallback,
});

export default function PhotosCardWebgl(props: { params?: PhotoDistortParams }) {
  const [load, setLoad] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }
        setLoad(true);
        observer.disconnect();
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="h-full min-w-0">
      {load ? <PhotosCardWebglLazy {...props} /> : <PhotosCardWebglFallback />}
    </div>
  );
}
