'use client';

import clsx from 'clsx';
import { forwardRef, ReactNode, useRef } from 'react';

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
      className={clsx(
        'ui-card relative rounded-2xl bg-panel-border p-[2px] shadow-card [background:var(--panel-border)]',
        containerClassName,
      )}
      ref={ref}
    >
      <div
        className={clsx(
          'card [&_>*]:opacity-1 relative z-[1] rounded-[14px] bg-panel-background p-1 text-text-primary md:p-2',
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
