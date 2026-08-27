'use client';

import { DialRoot, useDialKit } from 'dialkit';

import PhotosCardWebgl from '~/src/app/(main)/components/PhotosCardWebgl';
import { photoDistortDialConfig } from '~/src/app/(main)/components/PhotosCardWebgl/params';

export default function DemoPhotos() {
  const params = useDialKit('Photos', photoDistortDialConfig);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-5 py-12">
      <DialRoot position="top-right" defaultOpen productionEnabled />
      <p className="text-text-muted mb-2 font-mono text-xs tracking-[0.2em] uppercase">Demo</p>
      <h1 className="text-text-primary mb-2 text-2xl font-semibold tracking-tight">Camera roll</h1>
      <p className="text-text-secondary mb-8 text-sm">
        Scroll horizontally. Slow, slide-by-slide motion stays clean. Fast flicks squash every photo
        and add horizontal motion blur. Use the panel to tune it.
      </p>
      <PhotosCardWebgl params={params} />
    </div>
  );
}
