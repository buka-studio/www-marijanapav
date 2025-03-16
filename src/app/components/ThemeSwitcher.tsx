'use client';

import { useTheme } from 'next-themes';

import { DarkIcon, LightIcon, SystemIcon } from '~/src/components/icons';
import useDidMount from '~/src/hooks/useDidMount';
import { cn } from '~/src/util';

const controls = [
  {
    icon: <DarkIcon className="z-1 relative h-5 w-5" />,
    value: 'dark',
  },
  {
    icon: <LightIcon className="z-1 relative h-5 w-5" />,
    value: 'light',
  },
  {
    icon: <SystemIcon className="z-1 relative h-5 w-5" />,
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
    <div className="relative flex items-center gap-3 rounded-full border border-panel-border bg-panel-background p-1 shadow-card">
      {/* note: motion.div layoutId loses position after page scrolls */}
      {didMount && (
        <div
          className="bg-theme-3 absolute left-0 top-[1.75] h-8 w-8 rounded-full !transition-[left] duration-300 ease-out"
          style={{
            left: highlightOffset,
          }}
        />
      )}

      {controls.map(({ icon, value }, i) => {
        const isActive = didMount && theme === value;
        return (
          <button
            className={cn('hover:text-theme-1 relative rounded-full p-[0.375rem]', {
              'text-text-primary': !isActive,
              'text-theme-1': isActive,
            })}
            key={value}
            aria-label={`Switch to ${value} theme`}
            onClick={() => setTheme(value)}
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
