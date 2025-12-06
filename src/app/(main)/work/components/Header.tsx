'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import Button from '~/src/components/ui/Button';

import MainHeader from '../../components/Header';
import { filters } from '../constants';

function getFilterLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => (word.length >= 3 ? word[0].toUpperCase() + word.slice(1) : word.toUpperCase()))
    .join(' ');
}

export default function Header() {
  const params = useSearchParams();
  const filter = params?.get('f');

  return (
    <MainHeader>
      <div className="filters flex flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-none md:overflow-visible">
        {filters.map((f) => (
          <Button
            key={f}
            asChild
            variant={f === filter ? 'secondary' : 'primary'}
            className="shrink-0 text-xs md:text-sm"
          >
            <Link {...{ href: f === 'all' ? `/work` : `/work?f=${f}` }}>{getFilterLabel(f)}</Link>
          </Button>
        ))}
      </div>
    </MainHeader>
  );
}
