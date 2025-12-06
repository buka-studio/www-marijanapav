'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import FolderClosedIcon from '~/src/components/icons/folder-closed.svg';
import FolderOpenedIcon from '~/src/components/icons/folder-opened.svg';

import Card from './Card';

export default function CurrentCard() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedItem((prev) => (prev === index ? null : index));
  };

  const folderItems = [
    {
      path: 'buka-studio/www-marijanapav',
      description:
        "Like any designer's portfolio, this site is a perpetual WIP. I'm often pushing small nitpick commits.",
    },
    { path: 'livekit/livekit-site', description: 'Another project description here' },
    { path: 'marijanapav/playground', description: 'Yet another project description' },
    { path: 'marijanapav/stamps', description: 'Final project description' },
  ];

  return (
    <Card className="">
      <div className="flex h-[280px]  flex-col justify-between">
        <div className="mb-14 flex items-center gap-2 font-sans text-text-secondary">
          Currently exploring frontend
        </div>

        <div className="flex flex-col  gap-2">
          {folderItems.map((item, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex cursor-pointer gap-2" onClick={() => toggleItem(index)}>
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{
                    scale: expandedItem === index ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 0.2,
                    times: [0, 0.5, 1],
                    ease: 'easeOut',
                  }}
                >
                  {expandedItem === index ? (
                    <FolderOpenedIcon className="h-5 w-5 transition-all duration-200 text-theme-1 hover:text-theme-2" />
                  ) : (
                    <FolderClosedIcon className="h-5 w-5 transition-all duration-200 text-theme-1 hover:text-theme-2" />
                  )}
                </motion.div>
                <p
                  className={`font-medium text-text-secondary transition-colors duration-200 ${
                    expandedItem === index ? 'text-theme-1' : ''
                  }`}
                >
                  {item.path}
                </p>
              </div>
              <AnimatePresence>
                {expandedItem === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeOut',
                    }}
                    className="text-text-secondary/60 ml-7 text-sm"
                  >
                    {item.description}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
