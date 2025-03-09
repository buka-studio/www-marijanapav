'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

import FolderClosedIcon from '~/src/components/icons/folder-closed.svg';
import FolderOpenedIcon from '~/src/components/icons/folder-opened.svg';
import Heading from '~/src/components/ui/Heading';
import Tag from '~/src/components/ui/Tag';

import Card from './Card';

export default function CurrentCard() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setExpandedItem((prev) => (prev === index ? null : index));
  };

  const folderItems = [
    {
      path: 'buka-studio/www-marijanapav',
      description: 'Personal portfolio website built with Next.js',
    },
    { path: 'buka-studio/www-marijanapav', description: 'Another project description here' },
    { path: 'buka-studio/www-marijanapav', description: 'Yet another project description' },
    { path: 'buka-studio/www-marijanapav', description: 'Final project description' },
  ];

  return (
    <Card className="">
      <div className="h-70 flex flex-col justify-between">
        <Heading as="h2" className="mb-10 flex items-center gap-2 font-sans text-text-secondary">
          Currently exploring frontend
        </Heading>

        <div className="flex flex-col gap-2">
          {folderItems.map((item, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex cursor-pointer gap-2" onClick={() => toggleItem(index)}>
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{
                    scale: expandedItem === index ? [1, 1.2, 0.95, 1.05, 1] : 1,
                  }}
                  transition={{
                    duration: 0.4,
                    times: [0, 0.2, 0.4, 0.6, 1],
                  }}
                >
                  {expandedItem === index ? (
                    <FolderOpenedIcon className="h-5 w-5 transition-all duration-200 hoverable:text-main-theme-1 hoverable:hover:text-main-theme-2" />
                  ) : (
                    <FolderClosedIcon className="h-5 w-5 transition-all duration-200 hoverable:text-main-theme-1 hoverable:hover:text-main-theme-2" />
                  )}
                </motion.div>
                <p
                  className={`text-text-secondary transition-colors duration-200 ${
                    expandedItem === index ? 'text-main-theme-1' : ''
                  }`}
                >
                  {item.path}
                </p>
              </div>
              {expandedItem === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-text-secondary/60 ml-7 text-sm"
                >
                  {item.description}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
