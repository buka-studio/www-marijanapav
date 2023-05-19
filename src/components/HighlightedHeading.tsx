"use client";

import clsx from "clsx";
import { ReactNode, forwardRef, useImperativeHandle, useState } from "react";
import "./HighlightedHeading.css";

type Props = {
  className?: string;
  children: ReactNode;
  onHighlightEnd?: () => void;
};

export type Controls = {
  start: () => void;
  reset: () => void;
};

const HighlightedText = forwardRef<Controls, Props>(function HighlightedText(
  { children, className = "", onHighlightEnd, ...props },
  ref
) {
  const [highlighted, setHighlighted] = useState(false);

  useImperativeHandle(ref, () => ({
    start: () => {
      setHighlighted(true);
    },
    reset: () => {
      setHighlighted(false);
    },
  }));

  return (
    <div
      className={clsx("highlight pb-1", className, { highlighted })}
      onTransitionEnd={() => {
        onHighlightEnd?.();
      }}
      {...props}
    >
      {children}
    </div>
  );
});

export default HighlightedText;
