'use client';

import NextImage from 'next/image';
import { ComponentProps, useState } from 'react';

import { cn } from '~/src/util';

function Image({
  className,
  ref,
  fade = true,
  ...props
}: ComponentProps<typeof NextImage> & { fade?: boolean; ref?: React.Ref<HTMLImageElement> }) {
  const [loaded, setLoaded] = useState(!fade);
  return (
    <NextImage
      {...props}
      ref={ref}
      onLoad={(e) => {
        props.onLoad?.(e);
        setLoaded(true);
      }}
      className={cn(
        fade && 'transition-all duration-500',
        fade && {
          'scale-95 blur-md': !loaded,
          'blur-0 scale-100': loaded,
        },
        className,
      )}
    />
  );
}

export default Image;
