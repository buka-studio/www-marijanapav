'use client';

import { cn } from '~/src/util';

export default function Header({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative flex h-9 items-center justify-between gap-5', className)}>
      <div className="h-5 w-5 bg-stone-900" />
      <span className="lg:hidden">A Journey Through Stamps: Reimagined</span>
    </div>
  );
}
