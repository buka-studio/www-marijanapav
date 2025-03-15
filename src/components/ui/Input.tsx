import { ComponentProps, forwardRef, ReactNode } from 'react';

import { cn } from '~/src/util';

type Props = {
  action?: ReactNode;
  containerClassName?: string;
};

const Input = forwardRef<HTMLInputElement, Props & ComponentProps<'input'>>(function Input(
  { children, className, containerClassName, action, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        'reounded-full bg-theme-3 [&:has(>_input:focus-visible)]:outline-theme-1 inline-flex rounded-full border border-transparent p-1 [&:has(>_input:focus-visible)]:outline',
        containerClassName,
      )}
    >
      <input
        className={cn(
          'input rounded-full bg-transparent px-4 text-text-primary placeholder:text-text-alt focus-visible:outline-none',
          className,
        )}
        ref={ref}
        {...rest}
      />
      {action && <div className="ml-2">{action}</div>}
    </div>
  );
});

export default Input;
