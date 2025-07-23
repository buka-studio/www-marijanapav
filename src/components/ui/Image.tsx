'use client';

import NextImage from 'next/image';
import { ComponentProps, useState } from 'react';

import { cn } from '~/src/util';

function Image({
  className,
  ref,
  ...props
}: ComponentProps<typeof NextImage> & { ref?: React.Ref<HTMLImageElement> }) {
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
}

export default Image;
