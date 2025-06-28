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
  id?: string;
};

const Card = forwardRef<HTMLDivElement, Props>(function Card(
  { children, className, id, containerClassName, as = 'article' },
  ref,
) {
  const Component = as;

  const borderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <Component
      className={cn(
        'ui-card relative rounded-[10px] bg-panel-border p-[1px] shadow-card',
        containerClassName,
      )}
      id={id}
    >
      <div
        className={cn(
          'card [&_>*]:opacity-1 relative z-[1] flex h-full flex-col rounded-[9px] bg-panel-background p-3 text-text-primary [&>*:first-child]:flex-1',
          className,
        )}
        ref={contentRef}
      >
        {children}
      </div>
      <div
        className={cn(
          'absolute left-0 top-0 h-full w-full rounded-[10px] bg-theme-1 opacity-30',
          relativeMouseClassname,
        )}
        ref={borderRef}
      />
    </Component>
  );
});

export default Card;
