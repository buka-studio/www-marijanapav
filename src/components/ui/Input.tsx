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
        'reounded-full inline-flex rounded-full border border-transparent bg-theme-3 p-1 [&:has(>_input:focus-visible)]:outline [&:has(>_input:focus-visible)]:outline-theme-1',
        containerClassName,
      )}
    >
      <input
        className={cn(
          'input rounded-full bg-transparent px-4 text-text-primary placeholder:text-text-muted focus-visible:outline-none',
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
