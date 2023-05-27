import clsx from "clsx";
import { ComponentProps, forwardRef, ReactNode } from "react";

type H = `h${1 | 2 | 3 | 4 | 5 | 6}`;

type Props = {
  children?: ReactNode;
  as?: H;
};

const Heading = forwardRef<HTMLHeadingElement, Props & ComponentProps<"h1">>(
  function Heading({ children, className = "", as = "h1", ...rest }, ref) {
    const Component = as;

    return (
      <Component
        className={clsx("ui-heading font-archivo text-text-primary", className)}
        ref={ref}
        {...rest}
      >
        {children}
      </Component>
    );
  }
);

export default Heading;