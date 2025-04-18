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
    <Card className="h-[200px]">
      <div className="flex h-full flex-col gap-4">
        <Heading
          as="h2"
          className=" flex items-center gap-2 font-sans font-semibold text-text-primary"
        >
          Working remotely, <br className="hidden md:block" />
          from Croatia
        </Heading>
        <p className="mt-auto text-text-primary">{croatiaTime} Time zone in Croatia (GMT+2)</p>
      </div>
    </Card>
  );
}
