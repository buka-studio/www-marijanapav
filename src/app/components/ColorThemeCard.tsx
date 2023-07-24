'use client';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { ComponentProps } from 'react';

import { ArrowRightIcon, ResetIcon } from '~/src/components/icons';

import Card from './Card';
import useColorTheme, { colorThemes } from './useColorTheme';

function Grid({ ...props }: ComponentProps<'svg'>) {
  const n = 200;

  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl border-[1px] border-text-alt2 text-text-alt2',
        props?.className,
      )}
    >
      <svg viewBox={`0 0 ${n} ${n}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          {Array.from({ length: n / 10 }).map((_, r, a) => (
            <line
              key={r}
              x1={0}
              y1={r * 10}
              x2={n}
              y2={r * 10}
              stroke="currentColor"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: n / 10 }).map((_, c, a) => (
            <line
              key={c}
              x1={c * 10}
              y1={0}
              x2={c * 10}
              y2={n}
              stroke="currentColor"
              strokeWidth={0.5}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

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
      <div className="flex h-[268px] w-full flex-col content-center gap-3">
        <div className="relative h-full">
          <Grid className="absolute left-0 top-0 h-full w-full" />
          <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
            <div className="rounded-full p-[1px] [background:var(--panel-border)]">
              <div className="relative flex gap-5 rounded-full bg-panel-background px-3 py-2 shadow-card">
                {colorThemes.map((t, i) => {
                  const isActive = t === colorTheme;
                  return (
                    <button
                      key={t}
                      onClick={() => setColorTheme(t)}
                      className={clsx('flex items-center rounded-full')}
                    >
                      <div
                        className={clsx(
                          'relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-200',
                          {
                            ['border-main-theme-1']: isActive,
                            ['border-main-theme-2']: !isActive,
                          },
                        )}
                      >
                        {isActive ? (
                          <motion.span
                            className="absolute h-3 w-3 rounded-full bg-main-theme-1"
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
        <div className="h-6 flex-shrink-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              className="flex justify-between"
              key={String(colorPicked)}
              {...slideRightProps}
            >
              <p className="text-text-secondary">
                {colorTheme ? 'Bring back grayscale' : 'Pick a color'}
              </p>

              <button
                aria-label="Reset color theme"
                className="group rounded-full"
                onClick={removeColorTheme}
                disabled={!colorTheme}
              >
                {colorTheme ? (
                  <ResetIcon className="text-text-secondary transition-all duration-200 group-hover:text-main-theme-1" />
                ) : (
                  <ArrowRightIcon className="h-5 w-5 -rotate-90 text-text-secondary" />
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
