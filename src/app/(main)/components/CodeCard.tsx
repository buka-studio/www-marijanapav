'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, FolderClosed, FolderLock, FolderOpen } from 'lucide-react';
import { useState } from 'react';

import CardTitle from '~/src/components/ui/CardTitle';
import { cn } from '~/src/util';

import Card from './Card';

const directoryData: DirectoryItem[] = [
  {
    name: 'buka-studio',
    githubUrl: 'https://github.com/buka-studio',
    children: [
      {
        name: 'echotab',
        githubUrl: 'https://github.com/buka-studio/echotab',
      },
      {
        name: 'cfntd.site',
        githubUrl: 'https://github.com/buka-studio/cfntd',
        isPrivate: true,
      },
      {
        name: 'www-marijanapav',
        githubUrl: 'https://github.com/buka-studio/www-marijanapav',
        children: [
          {
            name: 'stamps',
            githubUrl: 'https://github.com/buka-studio/www-marijanapav/tree/main/src/app/stamps',
          },
          {
            name: 'playground',
            isLocked: true,
          },
          {
            name: 'sketchbook',
            isLocked: true,
          },
        ],
      },
    ],
  },
  {
    name: 'marijanapav',
    githubUrl: 'https://github.com/marijanapav?tab=repositories',
    children: [
      {
        name: 'text-to-ascii',
        githubUrl: 'https://github.com/marijanapav/text-to-ascii',
      },
      {
        name: 'cutting-mat',
        isPrivate: true,
      },
      {
        name: 'geist-pixel-icons',
        isPrivate: true,
      },
      {
        name: 'geist-impact',
        isPrivate: true,
      },
    ],
  },
];

type DirectoryItem = {
  name: string;
  isLocked?: boolean;
  isPrivate?: boolean;
  githubUrl?: string;
  children?: DirectoryItem[];
};

interface TreeViewProps {
  data: DirectoryItem[];
  className?: string;
}

export function TreeView({ data, className }: TreeViewProps) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto text-sm', className)}>
      <ul className="space-y-1">
        {data.map((item, index) => (
          <TreeNode key={index} item={item} level={0} parentName="" />
        ))}
      </ul>
    </div>
  );
}

interface TreeNodeProps {
  item: DirectoryItem;
  level: number;
  parentName: string;
}

function TreeNode({ item, level, parentName }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = Boolean(item.children?.length);
  const hasLink = !item.isLocked && Boolean(item.githubUrl);
  const githubLabel = `Open ${item.name} on GitHub`;

  const toggleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const isDeepNested = parentName === 'www-marijanapav' || parentName === 'marijanapav';

  return (
    <li className="select-none">
      <div className="group hover:bg-panel-border hover:text-text-primary relative flex w-full min-w-0 items-center rounded-md">
        {hasLink && hasChildren ? (
          <>
            <a
              href={item.githubUrl}
              aria-label={githubLabel}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'absolute inset-0 z-[1] rounded-md',
                'focus-visible:ring-main-accent focus-visible:ring-offset-main-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              )}
            />
            <div
              className={cn(
                'text-text-primary group-hover:text-main-accent relative z-[2] flex w-full min-w-0 items-center px-2 py-1 text-left transition-colors',
                'pointer-events-none',
              )}
            >
              <div className="pointer-events-auto mr-1 flex size-4 shrink-0 items-center justify-center">
                <button
                  type="button"
                  onClick={toggleExpand}
                  disabled={item.isLocked}
                  className="text-text-primary group-hover:text-main-accent flex items-center justify-center rounded-sm disabled:opacity-50"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? `Collapse ${item.name}` : `Expand ${item.name}`}
                >
                  <TreeChevron isExpanded={isExpanded} />
                </button>
              </div>
              <TreeFolderIcon item={item} hasChildren={hasChildren} isExpanded={isExpanded} />
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              <TreeExternalArrow />
            </div>
          </>
        ) : hasLink ? (
          <a
            href={item.githubUrl}
            aria-label={githubLabel}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'text-text-primary hover:text-text-primary flex w-full min-w-0 items-center rounded-md px-2 py-1 text-left transition-colors',
              'focus-visible:ring-main-accent focus-visible:ring-offset-main-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
              { 'text-text-secondary': !hasChildren },
            )}
          >
            <span className="mr-1 w-4 shrink-0" />
            <TreeFolderIcon item={item} hasChildren={hasChildren} isExpanded={isExpanded} />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            <TreeExternalArrow />
          </a>
        ) : (
          <button
            type="button"
            onClick={toggleExpand}
            disabled={item.isLocked || !hasChildren}
            className={cn(
              'text-text-primary flex w-full min-w-0 items-center rounded-md px-2 py-1 text-left transition-colors',
              {
                'hover:text-main-accent': hasChildren,
                'hover:text-text-primary text-text-secondary': !hasChildren,
              },
            )}
          >
            {hasChildren ? (
              <div className="mr-1 flex size-4 shrink-0 items-center justify-center">
                <TreeChevron isExpanded={isExpanded} />
              </div>
            ) : (
              <span className="mr-1 w-4 shrink-0" />
            )}
            <TreeFolderIcon item={item} hasChildren={hasChildren} isExpanded={isExpanded} />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
          </button>
        )}
      </div>

      {hasChildren && isExpanded && (
        <ul
          className={cn('border-panel-overlay mt-1 border-l', {
            'ml-2 pl-2': isDeepNested,
            'ml-4 pl-4': !isDeepNested,
          })}
        >
          {item.children!.map((child, index) => (
            <TreeNode key={index} item={child} level={level + 1} parentName={item.name} />
          ))}
        </ul>
      )}
    </li>
  );
}

function TreeChevron({ isExpanded }: { isExpanded: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{ rotate: isExpanded ? 0 : -90 }}
      transition={{
        type: 'spring',
        bounce: 0.5,
        duration: 0.6,
      }}
    >
      <ChevronDown className="size-4" />
    </motion.div>
  );
}

function TreeFolderIcon({
  item,
  hasChildren,
  isExpanded,
}: {
  item: DirectoryItem;
  hasChildren: boolean;
  isExpanded: boolean;
}) {
  return (
    <span className="mr-1.5 shrink-0">
      {hasChildren ? (
        item.isPrivate ? (
          <FolderLock className="size-4" />
        ) : isExpanded ? (
          <FolderOpen className="size-4" />
        ) : item.isLocked ? (
          <FolderLock className="size-4" />
        ) : (
          <FolderClosed className="size-4" />
        )
      ) : item.isLocked || item.isPrivate ? (
        <FolderLock className="size-4" />
      ) : (
        <FolderClosed className="size-4" />
      )}
    </span>
  );
}

function TreeExternalArrow() {
  return (
    <span
      className="text-text-primary group-hover:text-primary ml-2 shrink-0 opacity-0 transition-[opacity,color] group-focus-within:opacity-100 group-hover:opacity-100"
      aria-hidden
    >
      <ArrowUpRight className="size-4" />
    </span>
  );
}

export default function CodeCard() {
  return (
    <Card>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <CardTitle variant="mono" className="shrink-0">
          Exploring code
        </CardTitle>
        <TreeView data={directoryData} />
      </div>
    </Card>
  );
}
