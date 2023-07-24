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
          'ui-tag rounded-lg px-2 py-1 flex items-center justify-center text-text-primary bg-main-theme-3',
          className,
        ),
      )}
    />
  );
}

export default Tag;
