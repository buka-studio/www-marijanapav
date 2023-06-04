'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

const links = {
  '/work': { label: 'Work', width: 4.5 },
  '/': { label: 'About', width: 4.8125 },
  '/contact': { label: 'Contact', width: 5.8125 },
};

export default function Navabar() {
  const pathSegment = `/${useSelectedLayoutSegment() || ''}` as keyof typeof links;
  const activeIndex = Object.keys(links).findIndex((path) => pathSegment === path);

  const highlightOffset = `${
    0.1875 +
    Object.values(links)
      .slice(0, activeIndex)
      .reduce((acc, curr) => acc + curr.width + 0.5, 0)
  }rem`;

  return (
    <nav className="flex items-center rounded-full p-1 gap-2 relative bg-panel-background shadow-card">
      {/* note: motion.div layoutId loses position after page scrolls */}
      <div
        className="absolute h-[90%] w-full bg-main-theme-3 rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${links[pathSegment].width}rem`,
          left: highlightOffset,
        }}
      />
      {Object.entries(links).map(([path, l], i) => (
        <Link href={path} key={l.label} className="py-1 px-4 z-[1] text-text-primary">
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
