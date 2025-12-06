import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

import CardTitle from '~/src/components/ui/CardTitle';
import LinkBox, { LinkBoxLink } from '~/src/components/ui/LinkBox';

import Card from './Card';

export default function WorkspaceCard() {
  return (
    <Card>
      <LinkBox className="group flex flex-col justify-between">
        <div className="text-text-primary group-hover:text-main-accent mb-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2">
            <CardTitle variant="mono">
              <LinkBoxLink
                href="https://www.workspaces.xyz/p/489-marijana-pavlinic"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded"
              >
                Workspace{' '}
              </LinkBoxLink>
            </CardTitle>
            <span className="text-sm">at workspaces.xyz</span>
          </div>
          <ArrowUpRight className="h-4 w-4 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="relative aspect-4/2 w-full overflow-hidden rounded-md">
          <Image
            src="/home/workspace.png"
            alt="workspaces.xyz"
            fill
            className="object-cover transition-all duration-300 group-hover:scale-105"
          />
          <div className="bg-panel-overlay absolute top-0 left-0 h-full w-full transition-colors duration-200" />
          {/* Rule of Thirds Grid - Only visible on hover */}
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {/* Vertical lines */}
            <div className="bg-text-primary/60 absolute top-0 bottom-0 left-1/3 w-px"></div>
            <div className="bg-text-primary/60 absolute top-0 bottom-0 left-2/3 w-px"></div>
            {/* Horizontal lines */}
            <div className="bg-text-primary/60 absolute top-1/3 right-0 left-0 h-px"></div>
            <div className="bg-text-primary/60 absolute top-2/3 right-0 left-0 h-px"></div>
          </div>
        </div>
      </LinkBox>
    </Card>
  );
}
