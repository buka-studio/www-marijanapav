'use client';

import Link from 'next/link';
import Button from '~/src/components/ui/Button';
import MainHeader from '../../components/Header';
import { Filter, filters } from '../constants';

function getFilterLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => (word.length >= 3 ? word[0].toUpperCase() + word.slice(1) : word.toUpperCase()))
    .join(' ');
}

export default function Header({ filter }: { filter?: Filter }) {
  return (
    <MainHeader>
      <div className="filters flex gap-1 items-center overflow-x-auto flex-nowrap whitespace-nowrap md:overflow-visible overflow-y-hidden">
        {filters.map((f) => (
          <Link href={f === 'all' ? `/work` : `/work?f=${f}`} passHref legacyBehavior key={f}>
            <Button
              as="a"
              variant={f === filter ? 'secondary' : 'primary'}
              className="text-xs md:text-sm"
            >
              {getFilterLabel(f)}
            </Button>
          </Link>
        ))}
      </div>
    </MainHeader>
  );
}
