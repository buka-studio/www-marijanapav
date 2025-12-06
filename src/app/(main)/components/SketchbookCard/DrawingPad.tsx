import { ArrowCounterClockwiseIcon, XIcon } from '@phosphor-icons/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { getStroke } from 'perfect-freehand';
import { ComponentProps, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/src/components/ui/Tooltip';
import { remap } from '~/src/math';
import { cn } from '~/src/util';

import { getSketchStrokeColor } from './util';

const INK_LEVEL_WIDTH = 185;

function ToolbarButton({
  children,
  tooltipLabel,
  className,
  ...props
}: ComponentProps<typeof motion.button> & { tooltipLabel: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          className={cn(
            'text-text-secondary hover:text-text-primary z-1 shrink-0 rounded-full opacity-80 hover:opacity-100 disabled:opacity-50',
            className,
          )}
          {...props}
          aria-label={tooltipLabel}
        >
          {children}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>{tooltipLabel}</TooltipContent>
    </Tooltip>
  );
}

function InkLevel({ percentageUsed }: { percentageUsed: number }) {
  return (
    <motion.div
      layout="size"
      className="bg-theme-3 h-2 overflow-hidden rounded-full"
      style={{
        width: INK_LEVEL_WIDTH,
        borderRadius: '9999px',
      }}
      initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
      transition={{ duration: 0.2, delay: 0.2 }}
    >
      <motion.div
        layout="size"
        className="bg-theme-1 h-full rounded-full"
        style={{
          width: `${remap(percentageUsed, 0, 1, INK_LEVEL_WIDTH, 0)}px`,
          borderRadius: '9999px',
        }}
      />
    </motion.div>
  );
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      layout="size"
      style={{
        borderRadius: '9999px',
      }}
      className="bg-panel-background/10 flex items-center gap-2 px-2 py-1 backdrop-blur"
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function SizeWarning({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, filter: 'blur(5px)' }}
      style={{ width: INK_LEVEL_WIDTH }}
      className="text-text-secondary flex items-center justify-center text-sm"
      transition={{ duration: 0.2, delay: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export function getLocalCoords(event: { clientX: number; clientY: number }, el: Element) {
  const rect = el.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'],
  );

  d.push('Z');
  return d.join(' ');
}

export interface DrawingPadRef {
  clear: () => void;
  getPaths: () => string[];
  getSVG: () => string;
}

export interface Props {
  onDraw: (filled: boolean) => void;
  onClear?: () => void;
  onCancel?: () => void;
  onUndo?: () => void;
  drawingPadRef: React.Ref<DrawingPadRef>;
  maxSizeKB?: number;
}

export default function DrawingPad({
  onDraw,
  drawingPadRef,
  onCancel,
  onClear,
  maxSizeKB = 300,
}: Props) {
  const [points, setPoints] = useState<[number, number, number][]>([]);
  const [paths, setPaths] = useState<string[]>([]);

  const ref = useRef<SVGElement | null>(null);

  const handleUndo = () => {
    if (paths.length > 0) {
      setPaths(paths.slice(0, -1));
    }
    if (paths.length === 0) {
      onClear?.();
    }
  };

  const handleClear = () => {
    setPaths([]);
  };

  useImperativeHandle(drawingPadRef, () => ({
    clear: () => {
      handleClear();
    },
    undo: () => {
      handleUndo();
    },
    getPaths: () => {
      return paths;
    },
    getSVG: () => {
      const el = ref.current;
      if (!el) {
        return '';
      }
      const { width, height } = el.getBoundingClientRect();

      const clone = el.cloneNode(true) as SVGElement;

      const color = getSketchStrokeColor();

      clone.style.setProperty('color', color || '#000');
      clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
      clone.setAttribute('width', width.toString());
      clone.setAttribute('height', height.toString());
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      return clone.outerHTML;
    },
  }));

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    (e.target as SVGSVGElement).setPointerCapture(e.pointerId);

    if (ref.current) {
      const localCoords = getLocalCoords(e, ref.current);

      setPoints([[localCoords.x, localCoords.y, e.pressure]]);
    }
  }

  const getPathFromPoints = (points: [number, number, number][]) => {
    const stroke = getStroke(points, {
      size: 5,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    });

    return getSvgPathFromStroke(stroke);
  };

  function handlePointerUp(e: React.PointerEvent<SVGSVGElement>) {
    (e.target as SVGSVGElement).releasePointerCapture(e.pointerId);

    const pathData = getPathFromPoints(points);

    setPaths([...paths, pathData]);
    setPoints([]);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (e.buttons !== 1) {
      return;
    }

    if (ref.current) {
      const localCoords = getLocalCoords(e, ref.current);

      setPoints([...points, [localCoords.x, localCoords.y, e.pressure]]);
    }
  }

  useEffect(() => {
    onDraw(points.length > 0 || paths.length > 0);
  }, [paths, points, onDraw]);

  const pathData = getPathFromPoints(points);

  const totalSize = paths.reduce((acc, path) => acc + path.length, 0) / 1024;

  const svgTooBig = totalSize > maxSizeKB;

  return (
    <div className="relative h-full w-full">
      <svg
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={(e) => {
          ref.current = e;
        }}
        className={cn('relative isolate h-full w-full touch-none transition-opacity duration-200', {
          'text-theme-1 pointer-events-none cursor-not-allowed opacity-80': svgTooBig,
        })}
      >
        {points && <path d={pathData} fill="currentColor" />}
        {paths.map((path, index) => (
          <path key={index} d={path} fill="currentColor" />
        ))}
      </svg>
      <motion.div
        className="absolute top-2 flex w-full items-center justify-center px-2"
        initial={{ opacity: 0, y: 5, filter: 'blur(5px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px', transitionEnd: { filter: 'none' } }}
        exit={{ opacity: 0, y: -5, filter: 'blur(5px)' }}
        transition={{ duration: 0.2 }}
      >
        <LayoutGroup>
          <Toolbar>
            <AnimatePresence mode="wait" initial={false}>
              {svgTooBig ? (
                <SizeWarning key="size">Oops, you&apos;ve ran out of ink!</SizeWarning>
              ) : (
                <InkLevel key="ink" percentageUsed={totalSize / maxSizeKB} />
              )}
            </AnimatePresence>

            <ToolbarButton
              key="undo"
              disabled={paths.length === 0}
              onClick={handleUndo}
              tooltipLabel="Undo"
            >
              <ArrowCounterClockwiseIcon className="h-6 w-6" />
            </ToolbarButton>
            {onCancel && (
              <ToolbarButton key="cancel" onClick={onCancel} tooltipLabel="Cancel">
                <XIcon className="h-6 w-6" />
              </ToolbarButton>
            )}
          </Toolbar>
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
