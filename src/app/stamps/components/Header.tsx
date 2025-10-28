'use client';

import Link from 'next/link';

import { cn } from '~/src/util';

export default function Header({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex h-9 items-center justify-between gap-5 font-libertinus',
        className,
      )}
    >
      <Link href="/" className="flex items-baseline gap-2 text-stone-800">
        <span className="text-xs">◄</span> Back to Home
      </Link>
    </div>
  );
}
