'use client';

import clsx from 'clsx';
import { useTheme } from 'next-themes';

import { DarkIcon, LightIcon, SystemIcon } from '~/src/components/icons';
import useDidMount from '~/src/hooks/useDidMount';

const controls = [
  {
    icon: <DarkIcon className="w-5 h-5 z-1 relative" />,
    value: 'dark',
  },
  {
    icon: <LightIcon className="w-5 h-5 z-1 relative" />,
    value: 'light',
  },
  {
    icon: <SystemIcon className="w-5 h-5 z-1 relative" />,
    value: 'system',
  },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const didMount = useDidMount();

  const activeIndex = Math.max(
    controls.findIndex(({ value }) => value === theme),
    0,
  );

  const highlightOffset = `${activeIndex * 0.75 + activeIndex * (1.25 + 0.375 * 2) + 0.25}rem`;

  return (
    <div className="flex items-center gap-3 rounded-full border-main-theme-overlay border p-1 shadow-card bg-panel-background relative">
      {/* note: motion.div layoutId loses position after page scrolls */}
      {didMount && (
        <div
          className="absolute left-0 h-8 w-8 bg-main-theme-3 rounded-full top-[1.75] !transition-[left] duration-300 ease-out"
          style={{
            left: highlightOffset,
          }}
        />
      )}

      {controls.map(({ icon, value }, i) => {
        const isActive = didMount && theme === value;
        return (
          <button
            className={clsx('p-[0.375rem] hover:text-main-theme-1 rounded-full relative', {
              ['text-text-secondary']: !isActive,
              ['text-main-theme-1']: isActive,
            })}
            key={value}
            onClick={() => setTheme(value)}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
