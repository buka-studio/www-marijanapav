import { ComponentProps, ReactNode } from 'react';

import { cn } from '~/src/util';

type Props = {
  children?: ReactNode;
  variant?: 'default' | 'mono';
  ref?: React.Ref<HTMLDivElement>;
};

function CardTitle({
  children,
  className = '',
  variant = 'default',
  ref,
  ...rest
}: Props & ComponentProps<'div'>) {
  return (
    <h2
      className={cn(
        'text-text-primary text-base font-semibold',
        // Style variants
        variant === 'default' && 'font-sans',
        variant === 'mono' && 'font-mono text-xs tracking-[0.2em] uppercase',
        className,
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </h2>
  );
}

export default CardTitle;
