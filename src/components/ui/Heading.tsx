import { ComponentProps, ReactNode } from 'react';

import { cn } from '~/src/util';

type H = `h${1 | 2 | 3 | 4 | 5 | 6}`;

type Props = {
  children?: ReactNode;
  as?: H;
  variant?: 'default' | 'mono';
  ref?: React.Ref<HTMLHeadingElement>;
};

function Heading({
  children,
  className = '',
  as = 'h1',
  variant = 'default',
  ref,
  ...rest
}: Props & ComponentProps<'h1'>) {
  const Component = as;

  return (
    <Component
      className={cn(
        'ui-heading text-text-primary',
        variant === 'default' && 'font-archivo',
        variant === 'mono' && 'font-mono uppercase tracking-[0.2em]',
        className,
      )}
      ref={ref}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Heading;
