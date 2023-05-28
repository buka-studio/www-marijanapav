import Card from '~/src/components/ui/Card';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';
import MidjourneyImage from '../../../public/home/midjourney.png';

export default function CurrentCard() {
  return (
    <Card className="">
      <div className="flex flex-col h-full">
        <div className="mb-2">Currently exploring</div>
        <Heading className="text-6xl">MidJourney</Heading>
        <div className="mt-auto relative">
          <Image
            src={MidjourneyImage}
            alt="Midjourney generated image"
            placeholder="blur"
            height={170}
            className="rounded-xl w-full object-cover object-top max-h-[170px]"
          />
          <div className="transition-colors duration-200 rounded-xl bg-main-theme-overlay absolute h-full w-full top-0 left-0" />
        </div>
      </div>
    </Card>
  );
}
