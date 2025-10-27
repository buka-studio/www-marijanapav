'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

import { LogoIcon } from '~/src/components/icons';
import useScroll from '~/src/hooks/useScroll';
import { cn } from '~/src/util';

import ThemeSwitcher from './ThemeSwitcher';

const headerTriggerY = 50;

export default function Header({ children }: { children?: ReactNode }) {
  const { y, directionY } = useScroll();

  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex flex-wrap justify-between rounded-bl-[32px] rounded-br-[32px] px-5 py-4 transition-all duration-300 ease-in-out',
        {
          'translate-y-[-128px]': y > headerTriggerY && directionY === 'down',
        },
      )}
    >
      <div className="absolute inset-0 z-[-1] rounded-bl-[32px] rounded-br-[32px] backdrop-blur [mask-image:linear-gradient(to_top,transparent,black_65%)]" />
      <Link
        href="/"
        className="flex items-center gap-2 rounded-full text-text-primary"
        aria-label="Go to Home page"
      >
        <LogoIcon
          className={cn('transition-all duration-300', {
            'text-theme-1': y > headerTriggerY,
          })}
        />
        <span className="hidden pr-1 md:inline">Marijana Pavlinić</span>
      </Link>
      {children && (
        <div className="order-3 mt-4 w-full lg:order-none lg:mt-0 lg:w-auto">{children}</div>
      )}
      <ThemeSwitcher />
    </header>
  );
}
