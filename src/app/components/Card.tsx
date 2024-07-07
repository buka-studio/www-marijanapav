'use client';

import { forwardRef, ReactNode, useRef } from 'react';

import { relativeMouseClassname } from '~/src/components/MousePositionVarsSetter';
import { cn } from '~/src/util';

import './Card.css';

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
        'ui-card relative rounded-[22px] bg-panel-border p-[1px] shadow-card',
        containerClassName,
      )}
    >
      <div
        className={cn(
          'card [&_>*]:opacity-1 relative z-[1] rounded-[21px] bg-panel-background p-4 text-text-primary',
          className,
        )}
        ref={contentRef}
      >
        {children}
      </div>
      <div
        className={cn(
          'absolute left-0 top-0 h-full w-full rounded-[22px] bg-main-theme-1 opacity-30',
          relativeMouseClassname,
        )}
        ref={borderRef}
      />
    </Component>
  );
});

export default Card;
