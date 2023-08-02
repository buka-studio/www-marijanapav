'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

import useScroll from '../../hooks/useScroll';

import './FloatingNav.css';

import { twMerge } from 'tailwind-merge';

import { ArrowRightIcon } from '../../components/icons';

const links = {
  '/work': { label: 'Work', width: 4.1 },
  '/': { label: 'About', width: 4.55 },
  '/shop': { label: 'Shop', width: 4.125 },
  '/contact': { label: 'Contact', width: 5.25 },
};

export default function Navabar() {
  const pathSegment = `/${useSelectedLayoutSegment() || ''}` as keyof typeof links;
  const activeIndex = Object.keys(links).findIndex((path) => pathSegment === path);
  const { y } = useScroll();

  const highlightOffset = `${
    0.1875 +
    Object.values(links)
      .slice(0, activeIndex)
      .reduce((acc, curr) => acc + curr.width + 0.5, 0)
  }rem`;

  return (
    <>
      <nav className="relative z-[1] flex items-center gap-2 rounded-full bg-panel-background p-1 shadow-card">
        {/* note: motion.div layoutId loses position after page scrolls */}
        <div
          className="absolute h-[90%] rounded-full bg-main-theme-3 transition-all duration-300 ease-out"
          style={{
            width: `${links[pathSegment]?.width}rem`,
            left: highlightOffset,
          }}
        />
        {Object.entries(links).map(([path, l], i) => (
          <Link
            href={path}
            key={l.label}
            className="z-[1] rounded-full px-4 py-1 text-sm text-text-primary"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={twMerge(
          clsx(
            'anchor-top absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ',
            {
              ['right-0 opacity-0']: y < 50,
              ['-top-10 right-0 xs:-right-[2rem] xs:top-1/2']: y > 50,
            },
          ),
        )}
      >
        <span className="relative z-[1] flex h-[2rem] w-[2rem] items-center justify-end rounded-full bg-main-theme-3 px-2">
          <ArrowRightIcon className="h-6 w-6 -rotate-90 text-text-primary" />
        </span>
      </button>
    </>
  );
}
