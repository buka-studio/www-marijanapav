import { BukaIcon, LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function BukaCard() {
  return (
    <Card className="h-full">
      <div className="flex h-full flex-col justify-between gap-7">
        <div className="flex justify-between">
          <span className="text-text-secondary">What&apos;s Next</span>
        </div>
        <div className="flex items-center gap-4">
          <BukaIcon />
          <Heading className="text-4xl lg:text-5xl">
            <a href="https://www.buka.studio" className="group flex items-center gap-3 rounded-lg">
              buka.studio
              <LinkIcon className="h-8 w-8 rounded-full p-1 transition-all duration-150 group-hover:bg-main-theme-3 md:h-12 md:w-12" />
            </a>
          </Heading>
        </div>
        <p className="text-text-secondary">
          Branding and web project for a design and dev studio (not&nbsp;yet live but I dare you to
          check the placeholder).
        </p>
      </div>
    </Card>
  );
}
