import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import Heading from '~/src/components/ui/Heading';

import Card from './Card';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function LocationCard() {
  const croatiaTime = dayjs.tz(dayjs(), 'Europe/Zagreb').format('HH:mm');

  return (
    <Card className="h-full">
      <div className="flex h-full flex-col gap-4 pt-2">
        <Heading as="h1" className="text-primary text-3xl md:text-5xl xl:text-5xl">
          Working remotely, <br className="hidden md:block" />
          from Croatia
        </Heading>
        <p className="mt-auto text-text-secondary">{croatiaTime} Time zone in Croatia (GMT+2)</p>
      </div>
    </Card>
  );
}
