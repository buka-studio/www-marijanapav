'use client';

import { ArrowCounterClockwiseIcon, ArrowUpIcon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ComponentProps } from 'react';

import GridBackground from '~/src/components/GridBackground';
import CardTitle from '~/src/components/ui/CardTitle';
import { cn } from '~/src/util';

import Card from './Card';
import useColorTheme, { colorThemes } from './useColorTheme';

const slideRightProps: Partial<ComponentProps<typeof motion.div>> = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
  transition: {
    duration: 0.3,
    type: 'tween',
    ease: 'easeInOut',
  },
};

export default function ColorThemeCard() {
  const { colorTheme, removeColorTheme, setColorTheme } = useColorTheme();

  const colorPicked = Boolean(colorTheme);

  return (
    <Card>
      <div className="flex h-full min-h-[210px] w-full flex-col content-center gap-3">
        <div className="relative h-full">
          <GridBackground className="absolute top-0 left-0 h-full w-full" />
          <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center rounded-lg">
            <div className="bg-theme-3 rounded-full p-px">
              <div className="bg-panel-background relative flex gap-3 rounded-full px-2 py-2">
                {colorThemes.map((t, i) => {
                  const isActive = t === colorTheme;
                  return (
                    <button
                      key={t}
                      onClick={() => setColorTheme(t)}
                      className={cn('flex items-center rounded-full')}
                    >
                      <div
                        className={cn(
                          'relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200',
                          {
                            'border-theme-1': isActive,
                            'border-theme-2': !isActive,
                          },
                        )}
                      >
                        {isActive ? (
                          <motion.span
                            className="bg-theme-1 absolute h-3 w-3 rounded-full"
                            layoutId="color-theme-dot"
                          />
                        ) : (
                          <span className="absolute">{t.toUpperCase()[0]}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="h-6 shrink-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              className="flex h-full items-center justify-between"
              key={String(colorPicked)}
              {...slideRightProps}
            >
              <CardTitle variant="mono">
                {colorTheme ? 'Bring back grayscale' : 'Pick a color'}
              </CardTitle>

              <button
                aria-label="Reset color theme"
                className="group rounded-full"
                onClick={removeColorTheme}
                disabled={!colorTheme}
              >
                {colorTheme ? (
                  <ArrowCounterClockwiseIcon className="text-text-primary group-hover:text-theme-1 h-4 w-4 transition-all duration-200" />
                ) : (
                  <ArrowUpIcon className="text-text-primary h-4 w-4" />
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
