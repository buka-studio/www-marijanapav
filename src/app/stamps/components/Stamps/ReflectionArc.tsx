import { useId } from 'react';

import { cn } from '~/src/util';

interface Props {
  rotation?: number;
  size: number;
  className?: string;
  padding?: number;
  arcRadians?: number;
  arcOffset?: number;
  color?: string;
  width?: number;
  blur?: number;
}

export default function ReflectionArc({
  rotation = 0,
  size: requestedSize = 50,
  padding = 10,
  arcRadians = Math.PI / 2,
  className,
  arcOffset = 0,
  color = 'white',
  width = 5,
  blur = 4,
}: Props) {
  const id = useId();
  const size = requestedSize + blur;

  const radius = Math.max(size / 2 - padding, 0);

  const startAngle = -Math.PI / 2 + arcOffset;
  const endAngle = startAngle - arcRadians;

  const centerX = size / 2;
  const centerY = size / 2;

  const xStart = centerX + radius * Math.cos(startAngle);
  const yStart = centerY + radius * Math.sin(startAngle);
  const xEnd = centerX + radius * Math.cos(endAngle);
  const yEnd = centerY + radius * Math.sin(endAngle);

  // largeArcFlag = 1 if arc > 180° (arcRadians > Math.PI)
  const largeArcFlag = arcRadians > Math.PI ? 1 : 0;
  // sweepFlag = 0 => arcs in negative-angle direction (clockwise)
  const sweepFlag = 0;

  return (
    <svg
      className={cn(className)}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
    >
      <defs>
        <filter id={`arc-blur-${id}`}>
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>

      <path
        d={`M${xStart},${yStart}
             A${radius},${radius} 0 ${largeArcFlag},${sweepFlag}
             ${xEnd},${yEnd}`}
        stroke={color}
        strokeWidth={width}
        fill="none"
        filter={`url(#arc-blur-${id})`}
      />
    </svg>
  );
}
