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
}

export default CardTitle;
