'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

import useScroll from '../hooks/useScroll';

import './FloatingNav.css';

import { ArrowRightIcon } from './icons';

const links = {
  '/work': { label: 'Work', width: 4.5 },
  '/': { label: 'About', width: 4.8125 },
  '/contact': { label: 'Contact', width: 5.8125 },
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
      <nav className="flex items-center rounded-full p-1 gap-2 relative bg-panel-background shadow-card">
        {/* note: motion.div layoutId loses position after page scrolls */}
        <div
          className="absolute h-[90%] bg-main-theme-3 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${links[pathSegment]?.width}rem`,
            left: highlightOffset,
          }}
        />
        {Object.entries(links).map(([path, l], i) => (
          <Link href={path} key={l.label} className="py-1 px-4 z-[1] text-text-primary">
            {l.label}
          </Link>
        ))}
      </nav>
      <a
        href="#top"
        aria-label="Sroll to top"
        className={clsx(
          'anchor-top absolute top-1/2 -translate-y-1/2  rounded-full transition-all duration-300 ',
          {
            ['right-0 opacity-0']: y < 50,
            ['-right-[2rem]']: y > 50,
          },
        )}
      >
        <span className="bg-main-theme-3 h-[2rem] w-[2rem] flex justify-end items-center z-[1] rounded-full px-2 relative">
          <ArrowRightIcon className="w-6 h-6 -rotate-90" />
        </span>
      </a>
    </>
  );
}
