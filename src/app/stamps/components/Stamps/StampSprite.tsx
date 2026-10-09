'use client';

import { CSSProperties } from 'react';

import { cn } from '~/src/util';

import type { StampAtlas } from '../../atlas';
import { getStampSpriteSize } from '../../atlas-utils';
import { Stamp, stampDefaultDimensions } from '../../models';

interface Props {
  stamp: Stamp;
  atlas?: StampAtlas;
  sizeScale?: number;
  className?: string;
  style?: CSSProperties;
}

export default function StampSprite({
  stamp,
  atlas,
  sizeScale = 1,
  className,
  style,
}: Props) {
  const { width, height } = getStampSpriteSize(stamp, atlas, sizeScale);
  const item = atlas?.items[stamp.id];

  if (!atlas || !item) {
    return (
      <img
        src={stamp.src}
        alt={stamp.country || ''}
        width={stamp.width || stampDefaultDimensions.width}
        height={stamp.height || stampDefaultDimensions.height}
        draggable={false}
        data-slot="stamp-image"
        className={cn('pointer-events-none h-auto object-contain object-center', className)}
        style={{ width, height: stamp.height ? height : 'auto', ...style }}
      />
    );
  }

  const { src, width: sheetWidth, height: sheetHeight, scale } = atlas.metadata;

  return (
    <div
      role="img"
      aria-label={stamp.country || ''}
      data-slot="stamp-image"
      className={cn('pointer-events-none bg-no-repeat', className)}
      style={{
        width,
        height,
        backgroundImage: `url(${src})`,
        backgroundSize: `${(sheetWidth / scale) * sizeScale}px ${(sheetHeight / scale) * sizeScale}px`,
        backgroundPosition: `${(-item.x / scale) * sizeScale}px ${(-item.y / scale) * sizeScale}px`,
        ...style,
      }}
    />
  );
}
