import NextImage from 'next/image';

import { photos } from '../photos';

export default function PhotoPlaceholder() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-md" aria-hidden>
      <NextImage
        src={photos[0]}
        alt=""
        fill
        placeholder="blur"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 478px"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-panel-overlay" />
    </div>
  );
}
