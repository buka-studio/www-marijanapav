import { Slot } from '@radix-ui/react-slot';
import { ComponentProps } from 'react';

import { cn } from '~/src/util';

type Props = {
  asChild?: boolean;
};

function TextLink({ asChild, className, ...rest }: Props & ComponentProps<'a'>) {
  const Component = asChild ? Slot : ('a' as any);

  return (
    <Component {...rest} className={cn('hover:text-main-accent text-text-primary ', className)} />
  );
}

export default TextLink;
