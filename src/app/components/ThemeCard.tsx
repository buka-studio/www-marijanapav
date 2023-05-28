'use client';

import { ResetIcon } from '~/src/components/icons';
import Card from '~/src/components/ui/Card';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Grid from '../../../public/home/Grid.svg';

const coloredThemes = ['red', 'green', 'blue'] as const;

type ColoredTheme = (typeof coloredThemes)[number];

function getMainEl() {
  return document.querySelector('.main');
}
function getThemeClassnames() {
  return Array.from(getMainEl()?.classList.values()!).filter((c) => c.startsWith('theme-'));
}

function removeColoredTheme() {
  const mainEl = getMainEl();
  const themes = getThemeClassnames();
  for (const t of themes) {
    mainEl?.classList.remove(t);
  }
}

export default function ThemeCard() {
  const [coloredTheme, setColoredTheme] = useState<ColoredTheme | undefined>(undefined);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    removeColoredTheme();

    const mainEl = getMainEl();
    if (coloredTheme) {
      mainEl?.classList.add(`theme-${coloredTheme}-${resolvedTheme}`);
    }

    return () => {
      removeColoredTheme();
    };
  }, [coloredTheme, resolvedTheme]);

  return (
    <Card>
      <div className="h-[268px] flex content-center flex-col gap-4 w-full">
        <div className="relative">
          <Grid />
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="p-[1px] [background:var(--panel-border)] rounded-full">
              <div className="relative flex gap-5 rounded-full py-2 px-3 bg-panel-background shadow-card">
                {coloredThemes.map((t, i) => {
                  const isActive = t === coloredTheme;
                  return (
                    <button
                      key={t}
                      onClick={() => setColoredTheme(t)}
                      className={clsx('flex items-center')}
                    >
                      <div
                        className={clsx(
                          'transition-all duration-200 border-2 w-7 h-7 rounded-full relative flex items-center justify-center',
                          {
                            ['border-main-theme-1']: isActive,
                            ['border-main-theme-2']: !isActive,
                          },
                        )}
                      >
                        {isActive ? (
                          <motion.span
                            className="absolute h-3 w-3 bg-main-theme-1 rounded-full"
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
        <div className="flex justify-between">
          <p className="text-text-secondary">Bring back grayscale</p>
          <button
            aria-label="Reset colored theme"
            onClick={() => {
              setColoredTheme(undefined);
            }}
          >
            <ResetIcon className="text-text-alt" />
          </button>
        </div>
      </div>
    </Card>
  );
}
