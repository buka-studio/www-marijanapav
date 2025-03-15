import { Slot, Slottable } from '@radix-ui/react-slot';
import { ComponentProps, ReactNode } from 'react';

import { cn } from '~/src/util';

type Props = {
  asChild?: boolean;
  className?: string;
  buttonClassName?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  size?: 'sm' | 'default';
  variant?: 'primary' | 'secondary' | 'text';
};

function Button({
  asChild,
  iconLeft,
  iconRight,
  children,
  className = '',
  buttonClassName = '',
  size = 'default',
  variant = 'primary',
  ...rest
}: Props & ComponentProps<'button'>) {
  const Component = asChild ? Slot : ('button' as any);

  return (
    <div className={cn('overflow-hidden rounded-full', className)}>
      <Component
        {...rest}
        className={cn(
          'ui-button group relative flex cursor-pointer items-center gap-3 rounded-full outline-offset-2 transition-all duration-200 [clip-path:border-box]',
          {
            'px-4 py-[0.375rem] text-sm leading-6': size === 'default',
            'px-3 py-1 text-xs': size === 'sm',
            'px-1 py-1': !children,
            'bg-theme-3 text-text-primary': variant === 'primary',
            'bg-text-primary text-text-alt2': variant === 'secondary',
            'text-text-primary': variant === 'text',
          },
          buttonClassName,
        )}
      >
        {iconLeft && iconLeft}
        {children && <Slottable>{children}</Slottable>}
        {iconRight && iconRight}
        <div
          className={cn(
            'pointer-events-none absolute right-0 top-0 h-full w-full -translate-x-full bg-neutral-500 transition-all duration-300 group-hover:translate-x-0 group-focus-visible:translate-x-0 [.theme-dark_&]:mix-blend-color-dodge [.theme-light_&]:mix-blend-color-burn',
          )}
        />
      </Component>
    </div>
  );
}

export default Button;
