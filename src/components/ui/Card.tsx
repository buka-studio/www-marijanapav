'use client';

import { relativeMouseClassname } from '~/src/app/components/MouseVarsProvider';
import clsx from 'clsx';
import { forwardRef, ReactNode, useRef } from 'react';
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
      className={clsx('ui-card p-[1.5px] rounded-[22px] shadow-card relative', containerClassName)}
    >
      <div
        className={clsx(
          'card rounded-[21px] p-4 bg-panel-background text-text-primary [&_>*]:opacity-1 relative z-[1]',
          className,
        )}
        ref={contentRef}
      >
        {children}
      </div>
      <div
        className={clsx(
          'absolute top-0 left-0 w-full h-full bg-main-theme-1 opacity-30 rounded-[22px]',
          relativeMouseClassname,
        )}
        ref={borderRef}
      />
    </Component>
  );
});

export default Card;
