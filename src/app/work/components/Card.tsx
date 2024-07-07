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
        'ui-card relative rounded-2xl bg-panel-border p-[1px] shadow-card [background:var(--panel-border)]',
        containerClassName,
      )}
      ref={ref}
    >
      <div
        className={cn(
          'card [&_>*]:opacity-1 relative z-[1] rounded-[15px] bg-panel-background p-1 text-text-primary',
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
