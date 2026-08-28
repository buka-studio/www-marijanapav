'use client';

import NextImage from 'next/image';
import { ComponentProps, useState } from 'react';

import { cn } from '~/src/util';

type ImageProps = ComponentProps<typeof NextImage> & {
  ref?: React.Ref<HTMLImageElement>;
  transition?: boolean;
};

function Image({ className, ref, transition = true, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(!transition);

  return (
    <NextImage
      {...props}
      ref={ref}
      onLoad={(e) => {
        onLoad?.(e);
        if (transition) {
          setLoaded(true);
        }
      }}
      className={cn(
        {
          'transition-all duration-500': transition,
          'scale-95 blur-md': transition && !loaded,
          'blur-0 scale-100': transition && loaded,
        },
        className,
      )}
    />
  );
}

export default Image;
