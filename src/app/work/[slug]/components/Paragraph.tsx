import clsx from 'clsx';
import { ComponentProps } from 'react';
import { twMerge } from 'tailwind-merge';

export default function Paragraph({ className, children, ...rest }: ComponentProps<'p'>) {
  return (
    <p className={twMerge(clsx('max-w-xl', className))} {...rest}>
      {children}
    </p>
  );
}
