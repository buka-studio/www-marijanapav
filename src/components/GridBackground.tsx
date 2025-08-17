import { ComponentProps } from 'react';

import { cn } from '../util';

// todo: move to canvas?
export default function GridBackground({
  n = 200,
  className,
  ...props
}: ComponentProps<'svg'> & { n?: number }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border border-panel-border text-text-contrast',
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${n} ${n}`}
        fill="none"
        className="h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
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
