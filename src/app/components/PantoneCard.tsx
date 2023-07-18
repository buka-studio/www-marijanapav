'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ComponentProps, useEffect, useState } from 'react';

import { Theme } from '~/src/app/constants';
import ClientRendered from '~/src/components/ClientRendered';

import { InfoIcon } from '../../components/icons';
import Card from './Card';

import './PantoneCard.css';

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
  const [pantone, setPantone] = useState<Pantone | undefined>();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const el = document.querySelector('.main');
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const [theme] = Array.from(el?.classList.values()! || []).filter((c) =>
            c.startsWith('theme-'),
          );

          setPantone(theme ? pantoneByTheme[theme.slice(6) as Theme] : undefined);
        }
      });
    });

    observer.observe(el!, {
      attributes: true,
    });
  }, []);

  const name = (pantone || pantoneByTheme[resolvedTheme as Theme])?.name;

  return (
    <Card containerClassName="z-[3]">
      <div className="h-[268px] flex flex-col gap-4 w-full">
        <div className="bg-main-theme-2 transition-all duration-250 flex-1 rounded-lg"></div>
        <div className="flex justify-between overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p className="text-text-secondary" key={name} {...slideLeftProps}>
              PANTONE <ClientRendered>{name}</ClientRendered>
            </motion.p>
          </AnimatePresence>

          <button aria-describedby="pantone-tooltip" aria-label="Open Pantone tooltip">
            <InfoIcon className="text-text-secondary" />
            <div role="tooltip" id="pantone-tooltip">
              Sorry, these Pantone color names are entirely fictional.
            </div>
          </button>
        </div>
      </div>
    </Card>
  );
}
