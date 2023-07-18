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
      <div className="flex flex-col h-full gap-4 pt-2">
        <Heading as="h1" className="text-primary text-4xl md:text-5xl xl:text-6xl">
          Working remotely, from Croatia
        </Heading>
        <p className="mt-auto text-text-secondary">{croatiaTime} Time zone in Croatia (GMT+2)</p>
      </div>
    </Card>
  );
}
