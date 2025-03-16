import { Slot } from '@radix-ui/react-slot';
import { ComponentProps } from 'react';

import { cn } from '~/src/util';

type Props = {
  asChild?: boolean;
  variant?: 'filled' | 'dashed';
};

function Tag({ asChild, className, variant = 'filled', ...rest }: Props & ComponentProps<'div'>) {
  const Component = asChild ? Slot : ('div' as any);

  return (
    <Component
      {...rest}
      className={cn(
        'ui-tag flex items-center justify-center whitespace-nowrap rounded-lg px-2 py-1 text-text-primary',
        variant === 'filled' && 'bg-theme-3',
        variant === 'dashed' && 'border-text-muted border border-dashed',
        className,
      )}
    />
  );
}

export default Tag;
