'use client';

import dayjs from 'dayjs';
import { ArrowUpRight } from 'lucide-react';

import Heading from '~/src/components/ui/Heading';

import Card from './Card';

const formatDate = (unixTimestamp: string) => {
  const date = new Date(parseInt(unixTimestamp) * 1000);
  return dayjs(date).format('DD/MMM/YYYY');
};

export default function NotesCard() {
  const lastUpdated = process.env.NEXT_PUBLIC_BUILD_TIME;

  return (
    <Card className="">
      <div className="flex flex-col justify-between gap-5">
        <Heading
          as="h2"
          className=" flex items-center gap-2 font-sans font-semibold text-text-primary"
        >
          Notes
        </Heading>
        <p className="text-sm leading-5 text-text-primary">
          This site is constantly evolving, expect frequent nitpick commits. Last updated:{' '}
          <a
            href="https://github.com/buka-studio/www-marijanapav/commits"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-0.5 text-text-secondary transition-colors hover:text-text-primary"
          >
            {lastUpdated ? formatDate(lastUpdated!) : 'N/A'}
            <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </p>
      </div>
    </Card>
  );
}
