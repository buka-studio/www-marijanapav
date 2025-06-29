import { ComponentProps, forwardRef, ReactNode } from 'react';

import { cn } from '~/src/util';

type Props = {
  children?: ReactNode;
  variant?: 'default' | 'mono';
};

const CardTitle = forwardRef<HTMLDivElement, Props & ComponentProps<'div'>>(function CardTitle(
  { children, className = '', variant = 'default', ...rest },
  ref,
) {
  return (
    <h2
      className={cn(
        'text-base font-semibold text-text-primary',
        // Style variants
        variant === 'default' && 'font-sans',
        variant === 'mono' && 'font-mono text-xs uppercase tracking-[0.2em]',
        className,
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </h2>
  );
});

export default CardTitle;
