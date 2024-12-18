import { Slot } from '@radix-ui/react-slot';
import { ComponentProps } from 'react';

import { cn } from '~/src/util';

type Props = {
  asChild?: boolean;
};

function Tag({ asChild, className, ...rest }: Props & ComponentProps<'div'>) {
  const Component = asChild ? Slot : ('div' as any);

  return (
    <Component
      {...rest}
      className={cn(
        'ui-tag flex items-center justify-center whitespace-nowrap rounded-lg bg-main-theme-3 px-2 py-1 text-text-primary',
        className,
      )}
    />
  );
}

export default Tag;
