import { BukaIcon, LinkIcon } from '~/src/components/icons';
import CardTitle from '~/src/components/ui/CardTitle';

import Card from './Card';

export default function BukaCard() {
  return (
    <Card className="h-full">
      <div className="flex h-full flex-col justify-between gap-7">
        <div className="flex justify-between">
          <CardTitle variant="mono" className="border-panel-border">
            Latest side-project
          </CardTitle>
        </div>
        <div className="flex items-center gap-4">
          <BukaIcon className="[&_*]:origin-center [&_*]:[transform-box:fill-box] [&_.ping]:animate-ping-slow" />
          <div className="font-archivo text-3xl md:text-4xl">
            <a
              className="group flex items-center gap-3 rounded-lg"
              href="https://echotab.buka.studio"
              target="_blank"
            >
              EchoTab
              <LinkIcon className="h-8 w-8 rounded-full p-1 transition-all duration-150 group-hover:bg-theme-3 md:h-12 md:w-12" />
            </a>
          </div>
        </div>
        <p className="text-sm text-text-primary">
          A clean browser extension for managing browser tabs and bookmarks, with multi-select,
          smart tagging and command menu for quick actions. Always updating.
        </p>
      </div>
    </Card>
  );
}
