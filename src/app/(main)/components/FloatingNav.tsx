'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

import useScroll from '~/src/hooks/useScroll';

import './FloatingNav.css';

import { ArrowRightIcon } from '~/src/components/icons';
import { cn } from '~/src/util';

const links = {
  '/work': { label: 'Work', width: 4.1 },
  '/': { label: 'About', width: 4.55 },
  '/shop': { label: 'Shop', width: 4.125 },
  '/contact': { label: 'Contact', width: 5.4 },
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
      <nav className="border-panel-border bg-panel-background shadow-card relative z-1 flex items-center gap-2 rounded-full border p-1">
        {/* note: motion.div layoutId loses position after page scrolls */}
        <div
          className="bg-theme-3 absolute h-[90%] rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${links[pathSegment]?.width}rem`,
            left: highlightOffset,
          }}
        />
        {Object.entries(links).map(([path, l], i) => (
          <Link
            href={path}
            key={l.label}
            className="text-text-primary z-1 rounded-full px-4 py-1 text-sm"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Scroll to top"
        className={cn(
          'anchor-top absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-300',
          {
            'right-0 opacity-0': y < 50,
            'xs:-right-10 xs:top-1/2 -top-6 right-0': y > 50,
          },
        )}
      >
        <span className="bg-theme-3 relative z-1 flex h-8 w-8 items-center justify-end rounded-full px-2">
          <ArrowRightIcon className="text-text-primary h-6 w-6 -rotate-90" />
        </span>
      </button>
    </>
  );
}
