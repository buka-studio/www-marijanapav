import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

type Props = {
  asChild?: boolean;
};

function Tag({ asChild, className, ...rest }: Props & ComponentProps<'div'>) {
  const Component = asChild ? Slot : ('div' as any);

  return (
    <Component
      {...rest}
      className={twMerge(
        clsx(
          'ui-tag flex items-center justify-center rounded-lg bg-main-theme-3 px-2 py-1 text-text-primary',
          className,
        ),
      )}
    />
  );
}

export default Tag;
