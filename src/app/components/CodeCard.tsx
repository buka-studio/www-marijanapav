'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, FolderClosed, FolderLock, FolderOpen } from 'lucide-react';
import { useState } from 'react';

import Heading from '~/src/components/ui/Heading';
import { cn } from '~/src/util';

import Card from './Card';

const directoryData: DirectoryItem[] = [
  {
    name: 'buka-studio',
    githubUrl: 'https://github.com/buka-studio',
    children: [
      { name: 'echotab', githubUrl: 'https://github.com/buka-studio/echotab' },
      {
        name: 'www-marijanapav',
        githubUrl: 'https://github.com/buka-studio/www-marijanapav',
        children: [
          {
            name: 'playground',
            isLocked: true,
          },
          {
            name: 'stamps',
          },
        ],
      },
    ],
  },
  {
    name: 'livekit',
    githubUrl: 'https://github.com/livekit',
    children: [
      { name: 'livekit-site', isLocked: true },
      { name: 'web', isLocked: true },
    ],
  },
];

type DirectoryItem = {
  name: string;
  isLocked?: boolean;
  githubUrl?: string;
  children?: DirectoryItem[];
};

interface TreeViewProps {
  data: DirectoryItem[];
  className?: string;
}

export function TreeView({ data, className }: TreeViewProps) {
  return (
    <div className={cn('h-[240px] text-sm', className)}>
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
  const hasChildren = item.children && item.children.length > 0;

  const toggleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  // Special indentation for www-marijanapav children
  const isDeepNested = parentName === 'www-marijanapav';

  return (
    <li className="select-none">
      <div className="hover:bg-panel-overlay group relative flex w-full items-center rounded-md ">
        <button
          onClick={toggleExpand}
          disabled={item.isLocked || !hasChildren}
          className={cn(
            'flex w-full items-center rounded-md px-2 py-1 text-left text-text-secondary transition-colors hover:text-text-primary',
            { 'text-text-muted': !hasChildren },
          )}
        >
          {hasChildren ? (
            <div className="mr-1 flex h-4 w-4 items-center justify-center">
              <motion.div
                initial={false}
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{
                  type: 'spring',
                  bounce: 0.5,
                  duration: 0.6,
                }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </div>
          ) : (
            <span className="mr-1 w-4" />
          )}

          <span className="mr-1.5">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4" />
              ) : item.isLocked ? (
                <FolderLock className="h-4 w-4" />
              ) : (
                <FolderClosed className="h-4 w-4" />
              )
            ) : item.isLocked ? (
              <FolderLock className="h-4 w-4" />
            ) : (
              <FolderClosed className="h-4 w-4" />
            )}
          </span>

          <span className="flex-1">{item.name}</span>
        </button>
        {item.isLocked ? null : item.githubUrl ? (
          <a
            href={item.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary absolute right-2 rounded-md opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          >
            <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : null}
      </div>

      {hasChildren && isExpanded && (
        <ul
          className={cn(
            'mt-1',
            'border-panel-overlay border-l',
            isDeepNested ? 'ml-2 pl-2' : 'ml-4 pl-4',
          )}
        >
          {item.children!.map((child, index) => (
            <TreeNode key={index} item={child} level={level + 1} parentName={item.name} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CodeCard() {
  return (
    <Card>
      <Heading
        as="h2"
        className="mb-14 flex items-center gap-2 font-sans font-semibold text-text-secondary"
      >
        {' '}
        Currently exploring a bit of code
      </Heading>
      <TreeView data={directoryData} />
    </Card>
  );
}
