'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ComponentProps } from 'react';

import { Theme } from '~/src/app/constants';
import ClientRendered from '~/src/components/ClientRendered';
import { InfoIcon } from '~/src/components/icons';
import CardTitle from '~/src/components/ui/CardTitle';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/src/components/ui/Tooltip';

import Card from './Card';

import './PantoneCard.css';

import useColorTheme from './useColorTheme';

type Pantone = {
  name: string;
};

const pantoneByTheme: Record<Theme, Pantone> = {
  'blue-light': { name: 'Misty Morning' },
  'blue-dark': { name: 'Midnight Cruising' },
  'red-light': { name: 'Golden Hour' },
  'red-dark': { name: 'Lava Lamp' },
  'green-light': { name: 'Pistacchio Cream' },
  'green-dark': { name: 'The Matrix' },
  dark: { name: 'Jade Dusk' },
  light: { name: 'Ghost Fog' },
};

const slideLeftProps: Partial<ComponentProps<typeof motion.div>> = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: {
    duration: 0.3,
    type: 'tween',
    ease: 'easeInOut',
  },
};

export default function PantoneCard() {
  const { resolvedTheme } = useTheme();
  const { colorTheme } = useColorTheme();

  const themeName = [colorTheme, resolvedTheme].filter(Boolean).join('-');

  const name = pantoneByTheme[themeName as Theme]?.name;

  return (
    <Card containerClassName="z-3 pantone-card">
      <div className="flex min-h-[210px] w-full flex-col gap-3">
        <div className="bg-theme-2 flex-1 rounded-md transition-all duration-250"></div>
        <div className="flex justify-between">
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div className="text-text-primary" key={name} {...slideLeftProps}>
                <CardTitle variant="mono" className="inline">
                  PANTONE
                </CardTitle>{' '}
                <span className="text-sm">
                  <ClientRendered>{name}</ClientRendered>
                </span>
              </motion.div>
            </AnimatePresence>
          </div>
          <Tooltip>
            <TooltipTrigger className="rounded-full" aria-label="Fictional Pantone color name">
              <InfoIcon className="text-text-primary" />
            </TooltipTrigger>
            <TooltipContent className="w-[200px] text-center">
              Sorry, these Pantone color names are entirely fictional.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}
