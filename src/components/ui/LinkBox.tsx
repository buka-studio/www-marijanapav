import { Slot } from 'radix-ui';
import { ComponentProps, ReactNode } from 'react';

import { cn } from '../../util';

interface Props extends ComponentProps<'div'> {
  children?: ReactNode;
  asChild?: boolean;
}

function LinkBox({
  asChild,
  children,
  className = '',
  ref,
  ...props
}: Props & { ref?: React.Ref<HTMLElement> }) {
  const Component = asChild ? Slot.Root : ('div' as any);
  return (
    <Component
      ref={ref}
      className={cn(
        'relative [&_*[role="button"]]:relative [&_*[role="button"]]:z-1 [&_a:not(.link-overlay)]:relative [&_a:not(.link-overlay)]:z-1 [&_button]:relative [&_button]:z-1',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function LinkBoxLink({
  children,
  className = '',
  ref,
  ...props
}: ComponentProps<'a'> & { ref?: React.Ref<HTMLAnchorElement> }) {
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
}

export default LinkBox;
