import clsx from "clsx";
import { ComponentProps, ReactNode, forwardRef } from "react";

type Props = {
  children?: ReactNode;
};

const Tag = forwardRef<HTMLDivElement, Props & ComponentProps<"div">>(
  function Tag({ children, className = "", ...rest }, ref) {
    return (
      <div
        className={clsx(
          "ui-tag rounded-lg px-2 py-1 flex items-center justify-center text-text-primary bg-main-theme-3",
          className
        )}
        ref={ref}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

export default Tag;
