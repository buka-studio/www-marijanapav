import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';
import Tag from '~/src/components/ui/Tag';

import MidjourneyImage from '../../../public/home/midjourney.png';
import Card from './Card';

export default function CurrentCard() {
  return (
    <Card className="">
      <div className="flex flex-col h-full">
        <div className="mb-2 text-text-secondary">Currently exploring</div>
        <Heading className="text-4xl md:text-6xl mb-3 md:mb-auto flex items-center gap-3">
          MidJourney<Tag className="text-xs mt-5 font-sans">v5.1</Tag>
        </Heading>
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
