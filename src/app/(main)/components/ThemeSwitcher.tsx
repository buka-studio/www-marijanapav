'use client';

import { Fragment } from 'react';
import { useTheme } from 'next-themes';

import useDidMount from '~/src/hooks/useDidMount';
import { cn } from '~/src/util';

const controls = [
  {
    value: 'dark',
    icon: (
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
        <path d="M10.5 1.8A6.5 6.5 0 1 0 14.2 12 5.6 5.6 0 0 1 10.5 1.8Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'light',
    icon: (
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
        <circle cx="8" cy="8" r="6.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    value: 'system',
    icon: (
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
        <rect x="1.5" y="2.5" width="13" height="11" fill="currentColor" />
      </svg>
    ),
  },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const didMount = useDidMount();

  return (
    <div className="border-panel-border bg-panel-background flex items-center gap-1 rounded-full border px-2 py-1">
      {controls.map(({ icon, value }, i) => {
        const isActive = didMount && theme === value;
        return (
          <Fragment key={value}>
            {i > 0 && (
              <span aria-hidden className="text-text-muted opacity-40 select-none">
                /
              </span>
            )}
            <button
              className={cn(
                'rounded-full p-1 transition-[color,opacity] duration-150',
                isActive
                  ? 'text-text-primary'
                  : 'text-text-muted opacity-40 hover:opacity-80',
              )}
              aria-label={`Switch to ${value} theme`}
              aria-pressed={isActive}
              onClick={() => setTheme(value)}
            >
              {icon}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
}
