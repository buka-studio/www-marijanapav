import { ComponentProps } from 'react';

import { cn } from '~/src/util';

export default function Paragraph({ className, children, ...rest }: ComponentProps<'p'>) {
  return (
    <p className={cn('max-w-xl', className)} {...rest}>
      {children}
    </p>
  );
}
