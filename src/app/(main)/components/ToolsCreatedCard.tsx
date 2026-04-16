'use client';

import type { ComponentType, SVGProps } from 'react';

import { CuttingMatIcon, TextToAsciiIcon } from '~/src/components/icons';
import CardTitle from '~/src/components/ui/CardTitle';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/src/components/ui/Tooltip';
import { cn } from '~/src/util';

import Card from './Card';

type Tool = {
  label: string;
  href?: string;
  Icon?: ComponentType<SVGProps<SVGSVGElement>>;
  placeholder?: boolean;
};

const tools: Tool[] = [
  {
    href: 'https://cutting-mat-generator.vercel.app/',
    label: 'Cutting mat bg generator',
    Icon: CuttingMatIcon,
  },
  {
    href: 'https://text-to-ascii-tool.vercel.app/',
    label: 'Text to ASCII',
    Icon: TextToAsciiIcon,
  },
  {
    label: 'More tools soon',
    placeholder: true,
  },
];

export default function ToolsCreatedCard() {
  return (
    <Card>
      <div className="flex flex-col justify-between gap-4">
        <CardTitle variant="mono">Tools I created</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          {tools.map((tool) => (
            <Tooltip key={tool.href ?? tool.label}>
              {tool.placeholder ? (
                <TooltipTrigger className="group rounded-[15px] focus-visible:ring-2 focus-visible:ring-theme-1 focus-visible:outline-none">
                  <ToolItem tool={tool} />
                </TooltipTrigger>
              ) : (
                <TooltipTrigger asChild>
                  <a
                    href={tool.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-[15px] focus-visible:ring-2 focus-visible:ring-theme-1 focus-visible:outline-none"
                    aria-label={tool.label}
                  >
                    <ToolItem tool={tool} />
                  </a>
                </TooltipTrigger>
              )}
              <TooltipContent side="top" sideOffset={6} className="text-center">
                {tool.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ToolItem({ tool }: { tool: Tool }) {
  return (
    <span
      className={cn(
        'relative flex aspect-square h-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[15px] border p-2 transition-colors duration-200 ease-out',
        {
          'border-theme-2 border-dashed bg-transparent group-hover:border-theme-1 group-focus-visible:border-theme-1':
            tool.placeholder,
          'border-theme-2 bg-panel-background group-hover:border-theme-1 group-hover:bg-main-background':
            !tool.placeholder,
        },
      )}
    >
      {tool.Icon ? <tool.Icon className="h-full w-full text-text-primary" aria-hidden /> : null}
    </span>
  );
}
