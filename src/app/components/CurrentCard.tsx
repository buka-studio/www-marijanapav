import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';
import Tag from '~/src/components/ui/Tag';

import MidjourneyImage from '../../../public/home/midjourney.png';
import Card from './Card';

export default function CurrentCard() {
  return (
    <Card className="">
      <div className="flex h-full flex-col">
        <div className="mb-2 text-text-secondary">Currently exploring</div>
        <Heading className="mb-3 flex items-center gap-3 text-4xl md:text-4xl">
          MidJourney<Tag className="mt-1 font-sans text-xs">--v 6.0</Tag>
        </Heading>
        <div className="relative mt-auto">
          <Image
            src={MidjourneyImage}
            quality={90}
            alt="Midjourney generated image"
            placeholder="blur"
            height={170}
            className="max-h-[170px] w-full rounded-md object-cover object-top [.theme-light_&]:invert"
          />
          <div className="absolute left-0 top-0 h-full w-full rounded-md bg-main-theme-overlay transition-colors duration-200" />
        </div>
      </div>
    </Card>
  );
}
