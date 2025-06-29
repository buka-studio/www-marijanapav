import { Slot } from '@radix-ui/react-slot';
import { ComponentProps, forwardRef, ReactNode } from 'react';

import { cn } from '../../util';

interface Props extends ComponentProps<'div'> {
  children?: ReactNode;
  asChild?: boolean;
}

const LinkBox = forwardRef<HTMLElement, Props>(function LinkBox(
  { asChild, children, className = '', ...props },
  ref,
) {
  const Component = asChild ? Slot : ('div' as any);
  return (
    <Component
      ref={ref}
      className={cn(
        'relative [&_*[role="button"]]:relative [&_*[role="button"]]:z-[1] [&_a:not(.link-overlay)]:relative [&_a:not(.link-overlay)]:z-[1] [&_button]:relative [&_button]:z-[1]',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

export const LinkBoxLink = forwardRef<HTMLAnchorElement, ComponentProps<'a'>>(function LinkBoxLink(
  { children, className = '', ...props },
  ref,
) {
  return (
    <a
      className={cn(
        'link-overlay before:absolute before:inset-0 before:block before:h-full before:w-full before:cursor-[inherit]',
        className,
      )}
      {...props}
      ref={ref}
    >
      {children}
    </a>
  );
});

export default LinkBox;
