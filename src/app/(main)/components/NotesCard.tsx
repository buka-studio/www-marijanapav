'use client';

import dayjs from 'dayjs';
import { ArrowUpRight } from 'lucide-react';

import CardTitle from '~/src/components/ui/CardTitle';

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
        <CardTitle variant="mono">Notes</CardTitle>
        <p className="text-text-primary text-sm leading-5">
          This site is constantly evolving, expect frequent nitpick commits. Last updated:{' '}
          <a
            href="https://github.com/buka-studio/www-marijanapav/commits"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-text-secondary hover:text-text-primary inline-flex items-center gap-0.5 rounded transition-colors"
          >
            {lastUpdated ? formatDate(lastUpdated!) : 'N/A'}
            <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </p>
      </div>
    </Card>
  );
}
