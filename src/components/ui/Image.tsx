'use client';

import NextImage from 'next/image';
import { ComponentProps, forwardRef, useState } from 'react';

import { cn } from '~/src/util';

const Image = forwardRef<HTMLImageElement, ComponentProps<typeof NextImage>>(function Image(
  { className, ...props },
  ref,
) {
  const [loaded, setLoaded] = useState(false);
  return (
    <NextImage
      {...props}
      ref={ref}
      onLoad={(e) => {
        props.onLoad?.(e);
        setLoaded(true);
      }}
      className={cn(
        'transition-all duration-500',
        {
          'scale-95 blur-md': !loaded,
          'scale-100 blur-0': loaded,
        },
        className,
      )}
    />
  );
});

export default Image;
