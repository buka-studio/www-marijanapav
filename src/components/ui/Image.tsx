"use client";

import clsx from "clsx";
import NextImage from "next/image";
import { ComponentProps, forwardRef, useState } from "react";

const Image = forwardRef<HTMLImageElement, ComponentProps<typeof NextImage>>(
  function Image(props, ref) {
    const [loaded, setLoaded] = useState(false);
    return (
      <NextImage
        {...props}
        ref={ref}
        onLoadingComplete={(e) => {
          props.onLoadingComplete?.(e);
          setLoaded(true);
        }}
        className={clsx(props.className || "", "transition-all duration-500", {
          ["blur-md scale-[97%]"]: !loaded,
          ["blur-0 scale-100"]: loaded,
        })}
      />
    );
  }
);

export default Image;
