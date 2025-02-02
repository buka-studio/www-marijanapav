import { BukaIcon, LinkIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function BukaCard() {
  return (
    <Card className="h-full">
      <div className="flex h-full flex-col justify-between gap-7">
        <div className="flex justify-between">
          <span className="text-text-secondary">Latest side-project</span>
        </div>
        <div className="flex items-center gap-4">
          <BukaIcon className="[&_.ping]:animate-ping-slow [&_*]:origin-center [&_*]:[transform-box:fill-box]" />
          <Heading className="text-3xl md:text-4xl">
            <a
              className="group flex items-center gap-3 rounded-lg"
              href="https://echotab.buka.studio"
              target="_blank"
            >
              EchoTab
              <LinkIcon className="h-8 w-8 rounded-full p-1 transition-all duration-150 group-hover:bg-main-theme-3 md:h-12 md:w-12" />
            </a>
          </Heading>
        </div>
        <p className="text-text-secondary">
          A clean and simple browser extension, that helps you manage thousands of tabs, with
          multi-select, smart tagging and Cmd+K command menu for quick browsing.
        </p>
      </div>
    </Card>
  );
}
