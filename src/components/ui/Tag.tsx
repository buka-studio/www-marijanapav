import { Slot } from '@radix-ui/react-slot';
import { ComponentProps } from 'react';

import { cn } from '~/src/util';

type Props = {
  asChild?: boolean;
};

function Tag({ asChild, className, ...rest }: Props & ComponentProps<'div'>) {
  const Component = asChild ? Slot : ('div' as any);

  return <Component {...rest} className={cn('ui-tag text-text-primary', className)} />;
}

export default Tag;
