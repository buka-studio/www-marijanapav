import { Slot } from 'radix-ui';
import { ComponentProps } from 'react';

import { cn } from '~/src/util';

type Props = {
  asChild?: boolean;
};

function TextLink({ asChild, className, ...rest }: Props & ComponentProps<'a'>) {
  const Component = asChild ? Slot.Root : ('a' as any);

  return (
    <Component {...rest} className={cn('text-text-primary hover:text-main-accent ', className)} />
  );
}

export default TextLink;
