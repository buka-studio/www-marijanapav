import { BukaIcon, LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function BukaCard() {
  return (
    <Card className="h-full">
      <div className="flex flex-col gap-7 h-full justify-between">
        <div className="flex justify-between">
          <span className="text-text-secondary">What&apos;s Next</span>
        </div>
        <div className="flex gap-4 items-center">
          <BukaIcon />
          <Heading className="text-4xl md:text-5xl">
            <a href="https://www.buka.studio" className="flex items-center gap-3 group">
              buka.studio
              <LinkIcon className="w-8 h-8 md:w-12 md:h-12 group-hover:bg-main-theme-3 rounded-full p-1 transition-all duration-150" />
            </a>
          </Heading>
        </div>
        <p className="text-text-secondary">
          Branding and web project for a design and dev studio
          <br />
          (not yet live but I dare you to check the placeholder).
        </p>
      </div>
    </Card>
  );
}
