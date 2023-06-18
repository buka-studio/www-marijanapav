import clsx from 'clsx';
import { ComponentProps, ReactNode, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type Props = {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  as?: 'a' | 'button';
  size?: 'sm' | 'default';
  variant?: 'primary' | 'secondary' | 'text';
};

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ComponentProps<'button'> & Props>(
  function Button(
    {
      as = 'button',
      iconLeft,
      iconRight,
      className = '',
      children,
      size = 'default',
      variant = 'primary',
      ...rest
    },
    ref,
  ) {
    const Component = as;

    return (
      <div className={clsx('overflow-hidden rounded-full', className)}>
        <Component
          ref={ref as any}
          {...(rest as any)}
          className={twMerge(
            clsx(
              'group transition-all duration-200 ui-button rounded-full flex items-center gap-3 outline-offset-2 relative overflow-hidden focus-within:ring-offset-current cursor-pointer',
              {
                ['text-sm leading-6 py-[6px] px-4']: size === 'default',
                ['text-xs px-3 py-1']: size === 'sm',
                ['px-1 py-1']: !children,
                ['text-text-primary bg-main-theme-3']: variant === 'primary',
                ['text-text-alt2 bg-text-primary']: variant === 'secondary',
                ['text-text-primary']: variant === 'text',
              },
            ),
          )}
        >
          {iconLeft && iconLeft}
          {children && children}
          {iconRight && iconRight}
          <div
            className={clsx(
              'right-0 pointer-events-none absolute top-0 w-full h-full [.theme-light_&]:mix-blend-color-burn [.theme-dark_&]:mix-blend-color-dodge bg-neutral-500 transition-all duration-300 group-hover:translate-x-0 -translate-x-full',
            )}
          />
        </Component>
      </div>
    );
  },
);

export default Button;
