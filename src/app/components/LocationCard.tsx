import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

import Heading from '~/src/components/ui/Heading';

import Card from './Card';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function LocationCard() {
  const croatiaTime = dayjs.tz(dayjs(), 'Europe/Zagreb').format('HH:mm');

  return (
    <Card>
      <div className="group relative h-[288px] w-full overflow-hidden rounded-md">
        <Image
          src="/home/workspace.png"
          alt="workspaces.xyz"
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-0 top-0 h-full w-full bg-panel-overlay transition-colors duration-200" />
      </div>
      <div className="mt-4">
        <a
          href="https://www.workspaces.xyz/p/489-marijana-pavlinic"
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <Heading
            as="h2"
            className="flex items-center justify-between font-sans font-semibold text-text-primary transition-colors group-hover:text-main-accent"
          >
            <span>
              Workspace tour at workspaces.xyz <br className="hidden md:block" />
            </span>
            <ArrowUpRight className="h-4 w-4 transition-opacity group-hover:opacity-100" />
          </Heading>
        </a>
      </div>
    </Card>
  );
}
