'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { ReactNode } from 'react';

import { LogoIcon } from '~/src/components/icons';
import useScroll from '~/src/hooks/useScroll';

import ThemeSwitcher from './ThemeSwitcher';

const headerTriggerY = 50;

export default function Header({ children }: { children?: ReactNode }) {
  const { y, directionY } = useScroll();

  return (
    <header
      className={clsx(
        'sticky top-0 z-10 flex flex-wrap justify-between rounded-bl-[32px] rounded-br-[32px] px-5 py-4 transition-all duration-300 ease-in-out',
        {
          ['translate-y-[-128px]']: y > headerTriggerY && directionY === 'down',
          ['[&] bg-transparent backdrop-blur-[6px]']: y > headerTriggerY,
        },
      )}
    >
      <Link
        href="/"
        className="flex items-center gap-2 rounded-full text-text-primary"
        aria-label="Go to Home page"
      >
        <LogoIcon
          className={clsx('transition-all duration-300', {
            ['text-main-theme-1']: y > headerTriggerY,
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
