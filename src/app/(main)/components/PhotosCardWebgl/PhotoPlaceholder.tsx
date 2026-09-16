import NextImage from 'next/image';

import { photos } from '../photos';

export default function PhotoPlaceholder() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-md"
      aria-hidden
    >
      <NextImage
        src={photos[0]}
        alt=""
        fill
        priority
        quality={80}
        placeholder="blur"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 478px"
        className="object-cover object-center"
      />
      <div className="bg-panel-overlay absolute inset-0" />
    </div>
  );
}
