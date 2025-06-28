import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

import CardTitle from '~/src/components/ui/CardTitle';
import Heading from '~/src/components/ui/Heading';

import Card from './Card';

export default function WorkspaceCard() {
  return (
    <Card>
      <div className="flex flex-col justify-between">
        <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-md">
          <Image
            src="/home/workspace.png"
            alt="workspaces.xyz"
            fill
            className="object-cover transition-all duration-300 group-hover:scale-105"
          />
          <div className="absolute left-0 top-0 h-full w-full bg-panel-overlay transition-colors duration-200" />
          {/* Rule of Thirds Grid - Only visible on hover */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {/* Vertical lines */}
            <div className="absolute bottom-0 left-1/3 top-0 w-px bg-text-primary/60"></div>
            <div className="absolute bottom-0 left-2/3 top-0 w-px bg-text-primary/60"></div>
            {/* Horizontal lines */}
            <div className="absolute left-0 right-0 top-1/3 h-px bg-text-primary/60"></div>
            <div className="absolute left-0 right-0 top-2/3 h-px bg-text-primary/60"></div>
          </div>
        </div>
        <div className="mt-4">
          <a
            href="https://www.workspaces.xyz/p/489-marijana-pavlinic"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Heading
              as="h2"
              className="flex items-center justify-between text-text-primary transition-colors group-hover:text-main-accent"
            >
              <span className="flex items-center gap-2">
                <CardTitle variant="mono">Workspace</CardTitle>
                <span className="text-sm">at workspaces.xyz</span>
              </span>
              <ArrowUpRight className="h-4 w-4 transition-opacity group-hover:opacity-100" />
            </Heading>
          </a>
        </div>
      </div>
    </Card>
  );
}
