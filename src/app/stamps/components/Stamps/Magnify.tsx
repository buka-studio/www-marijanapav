import { motion } from 'framer-motion';
import {
  createContext,
  MouseEvent,
  ReactNode,
  RefObject,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import { cn } from '~/src/util';

interface MagnifyProps {
  children: ReactNode;
  hover?: boolean;
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

interface MagnifyContextValue {
  node: ReactNode | null;
  setNode: (node: ReactNode | null) => void;
  coords: Coordinates;
  setCoords: (coords: Coordinates) => void;
  isHovering: boolean;
  setIsHovering: (hover: boolean) => void;
  dimensions: Dimensions;
  setDimensions: (dim: Dimensions) => void;
  containerRect: DOMRect | null;
  setContainerRect: (r: DOMRect | null) => void;
  hover: boolean;
}

const MagnifyContext = createContext<MagnifyContextValue | null>(null);

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function Magnify({ children, hover = true }: MagnifyProps): JSX.Element {
  const [node, setNode] = useState<ReactNode | null>(null);
  const [coords, setCoords] = useState<Coordinates>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const value: MagnifyContextValue = {
    node,
    setNode,
    coords,
    setCoords,
    isHovering,
    setIsHovering,
    dimensions,
    setDimensions,
    containerRect,
    setContainerRect,
    hover,
  };

  return <MagnifyContext.Provider value={value}>{children}</MagnifyContext.Provider>;
}

interface MagnifyInputProps {
  children: ReactNode;
  width?: number;
  height?: number;
  className?: string;
}

export function MagnifyInput({ children, className }: MagnifyInputProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const magnify = useContext(MagnifyContext);

  if (!magnify) {
    throw new Error('MagnifyInput must be used within a Magnify provider');
  }

  const { setNode, setCoords, setIsHovering, setDimensions, setContainerRect, hover } = magnify;

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const { offsetWidth, offsetHeight } = containerRef.current;
      setDimensions({ width: offsetWidth, height: offsetHeight });
      setContainerRect(containerRef.current.getBoundingClientRect());
      setNode(children);
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [setDimensions, setContainerRect, setNode, children]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContainerRect(rect);

    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseEnter = () => {
    if (containerRef.current) {
      setContainerRect(containerRef.current.getBoundingClientRect());
    }
    setNode(children);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const hoverHandlers = hover
    ? {
        onMouseMove: handleMouseMove,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      }
    : {};

  return (
    <div ref={containerRef} {...hoverHandlers} className={cn(className)}>
      {children}
    </div>
  );
}

interface MagnifierOutputRef {
  move: (x: number, y: number) => void;
}

interface MagnifyOutputProps {
  scale?: number;
  lensWidth?: number;
  lensHeight?: number;
  centerCursor?: boolean;
  coords?: Coordinates;
  className?: string;
  magnifierOutputRef?: RefObject<MagnifierOutputRef>;
}

export function MagnifyOutput({
  scale = 2,
  lensWidth = 200,
  lensHeight = 200,
  centerCursor = true,
  coords: propCoords,
  className,
  magnifierOutputRef,
  ...props
}: MagnifyOutputProps): JSX.Element | null {
  const magnify = useContext(MagnifyContext)!;

  const [imperativeCoords, setImperativeCoords] = useState<Coordinates | null>(null);
  useImperativeHandle(magnifierOutputRef, () => ({
    move: (x: number, y: number) => {
      setImperativeCoords({ x, y });
    },
  }));

  const { node, coords: stateCoords, isHovering, dimensions, containerRect, hover } = magnify;

  const coords =
    imperativeCoords !== null
      ? imperativeCoords
      : typeof propCoords === 'undefined'
        ? stateCoords
        : propCoords;

  let offsetX = coords.x;
  let offsetY = coords.y;

  if (centerCursor) {
    const halfLensWidthScaled = lensWidth / scale / 2;
    const halfLensHeightScaled = lensHeight / scale / 2;
    offsetX = coords.x - halfLensWidthScaled;
    offsetY = coords.y - halfLensHeightScaled;
  }

  const maxX = dimensions.width - lensWidth / scale;
  const maxY = dimensions.height - lensHeight / scale;

  offsetX = clamp(offsetX, 0, maxX);
  offsetY = clamp(offsetY, 0, maxY);

  const offsetFromCursor = 20;

  const lensTop = (containerRect?.top ?? 0) + coords.y - lensHeight / 2;
  const lensLeft = (containerRect?.left ?? 0) + coords.x + offsetFromCursor;

  const isVisible = (hover ? isHovering : true) && node;

  if (!isVisible || !containerRect) return null;

  return (
    <motion.div
      aria-hidden="true"
      role="presentation"
      key="magnify-lens"
      initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
      transition={{ duration: 0.2 }}
      className={cn('pointer-events-none fixed z-50 overflow-hidden rounded-xl border', className)}
      style={{ width: lensWidth, height: lensHeight, top: lensTop, left: lensLeft }}
      {...props}
    >
      <motion.div
        className={cn('magnified-plane absolute flex flex-wrap items-start')}
        style={{
          padding: '8px',
          width: dimensions.width,
          height: dimensions.height,
          transform: `scale(${scale}) translate(${-offsetX}px, ${-offsetY}px)`,
          transformOrigin: 'top left',
        }}
      >
        {node}
      </motion.div>
    </motion.div>
  );
}
