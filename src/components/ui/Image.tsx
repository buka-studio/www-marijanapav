'use client';

import clsx from 'clsx';
import NextImage from 'next/image';
import { ComponentProps, forwardRef, useState } from 'react';

const Image = forwardRef<HTMLImageElement, ComponentProps<typeof NextImage>>(
  function Image(props, ref) {
    const [loaded, setLoaded] = useState(false);
    return (
      <NextImage
        {...props}
        ref={ref}
        onLoad={(e) => {
          props.onLoad?.(e);
          setLoaded(true);
        }}
        className={clsx(props.className || '', 'transition-all duration-500', {
          ['scale-95 blur-md']: !loaded,
          ['scale-100 blur-0']: loaded,
        })}
      />
    );
  },
);

export default Image;
