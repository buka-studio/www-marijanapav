import { ComponentProps, ReactNode } from 'react';

import { cn } from '~/src/util';

type Props = {
  action?: ReactNode;
  containerClassName?: string;
  ref?: React.Ref<HTMLInputElement>;
};

function Input({
  children,
  className,
  containerClassName,
  action,
  ref,
  ...rest
}: Props & ComponentProps<'input'>) {
  return (
    <div
      className={cn(
        'reounded-full bg-theme-3 [&:has(>_input:focus-visible)]:outline-theme-1 inline-flex rounded-full border border-transparent p-1 [&:has(>_input:focus-visible)]:outline',
        containerClassName,
      )}
    >
      <input
        className={cn(
          'input text-text-primary placeholder:text-text-muted rounded-full bg-transparent px-4 focus-visible:outline-none',
          className,
        )}
        ref={ref}
        {...rest}
      />
      {action && <div className="ml-2">{action}</div>}
    </div>
  );
}

export default Input;
