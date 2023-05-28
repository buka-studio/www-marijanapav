import Card from '~/src/components/ui/Card';
import Heading from '~/src/components/ui/Heading';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import './cards.css';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function LocationCard() {
  const croatiaTime = dayjs.tz(dayjs(), 'Europe/Zagreb').format('HH:mm');

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full gap-4">
        <Heading as="h1" className="text-primary text-6xl mr-[60px]">
          Working remotely, from Croatia
        </Heading>
        <p className="mt-auto text-text-secondary">{croatiaTime} Time zone in Croatia (GMT+2)</p>
      </div>
    </Card>
  );
}
