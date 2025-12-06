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
        'ui-card bg-panel-border shadow-card relative rounded-lg p-px md:rounded-2xl',
        containerClassName,
      )}
      ref={ref}
    >
      <div
        className={cn(
          'card bg-panel-background text-text-primary relative z-1 rounded-[7px] p-1 md:rounded-[15px]',
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
