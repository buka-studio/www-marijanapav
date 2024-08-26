'use client';

import { forwardRef, ReactNode, useRef } from 'react';

import { cn } from '~/src/util';

type Props = {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  as?: 'div' | 'article';
};

const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { children, className, containerClassName, as = 'article' },
  ref,
) {
  const Component = as;

  const borderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Component
      className={cn(
        'ui-card relative rounded-lg bg-panel-border p-[1px] shadow-card [background:var(--panel-border)] md:rounded-2xl',
        containerClassName,
      )}
      ref={ref}
    >
      <div
        className={cn(
          'card [&_>*]:opacity-1 relative z-[1] rounded-[7px] bg-panel-background p-1 text-text-primary md:rounded-[15px]',
          className,
        )}
        ref={contentRef}
      >
        {children}
      </div>
    </Component>
  );
});

export default Card;
