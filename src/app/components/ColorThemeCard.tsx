'use client';

import clsx from 'clsx';
import { motion } from 'framer-motion';

import { ResetIcon } from '~/src/components/icons';

import Grid from '../../../public/home/Grid.svg';
import Card from './Card';
import useColorTheme, { colorThemes } from './useColorTheme';

export default function ColorThemeCard() {
  const { colorTheme, removeColorTheme, setColorTheme } = useColorTheme();

  return (
    <Card>
      <div className="h-[268px] flex content-center flex-col gap-4 w-full">
        <div className="relative">
          <Grid />
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="p-[1px] [background:var(--panel-border)] rounded-full">
              <div className="relative flex gap-5 rounded-full py-2 px-3 bg-panel-background shadow-card">
                {colorThemes.map((t, i) => {
                  const isActive = t === colorTheme;
                  return (
                    <button
                      key={t}
                      onClick={() => setColorTheme(t)}
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
          <button aria-label="Reset colored theme" onClick={removeColorTheme}>
            <ResetIcon className="text-text-secondary" />
          </button>
        </div>
      </div>
    </Card>
  );
}
