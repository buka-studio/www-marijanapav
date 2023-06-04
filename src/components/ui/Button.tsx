import clsx from 'clsx';
import { ComponentProps, ReactNode, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

import './Button.css';

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
      <Component
        ref={ref as any}
        {...(rest as any)}
        className={twMerge(
          clsx(
            'transition-all duration-200  ui-button rounded-full flex items-center gap-3 focus-visible:outline-none relative',
            className || '',
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
      </Component>
    );
  },
);

export default Button;
