'use client';

import { useAnimationFrame } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

import BackSVG from '~/public/work/illustrated-cards/Back.svg';
import useMatchMedia from '~/src/hooks/useMatchMedia';

type Vec2 = [number, number];

type Dimensions = {
  height: number;
  width: number;
};

type AnimationState = {
  card: Vec2;
  velocity: Vec2;
};

function updatePosition(
  card: Vec2,
  gravity: number,
  friction: number,
  speed: Vec2,
  bounds: Dimensions,
  height: number,
) {
  speed[1] += gravity;
  speed[1] *= friction;

  card[1] += speed[1];
  card[0] += speed[0];

  if (card[1] > bounds.height - height) {
    card[1] = bounds.height - height;
    speed[1] *= -0.8;
  } else if (card[1] < 0) {
    card[1] = height;
    speed[1] *= -0.8;
  }
}

function randFloat(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function Solitaire({ cardSrc }: { cardSrc: string }) {
  const theme = useTheme();

  const canvas = useRef<HTMLCanvasElement>(null);
  const ctx: React.Ref<CanvasRenderingContext2D | null> = useRef<CanvasRenderingContext2D>(null);

  const state = useRef<{ card: Vec2; velocity: Vec2 } | null>(null);

  const img = useRef<HTMLImageElement | null>(null);
  const tickDiffRef = useRef(0);

  const narrow = useMatchMedia('(max-width: 640px)');
  const cardSize = narrow ? { width: 80, height: 120 } : { width: 100, height: 150 };

  const containerRef = useRef<HTMLDivElement>(null);

  function init() {
    const x = Math.random() * canvas.current!.width;
    const xFactor = narrow ? 4 : 8;
    const yFactor = narrow ? 2.5 : 5;

    const dirX = x > canvas.current!.width / 2 ? -1 * xFactor : 1 * xFactor;

    const state = {
      card: [x, 0],
      velocity: [dirX * randFloat(0.5, 2), yFactor * randFloat(0.75, 2)],
    } satisfies AnimationState;

    return state;
  }

  useEffect(() => {
    ctx.current = canvas.current!.getContext('2d')!;
    const width = canvas.current!.clientWidth;
    const height = canvas.current!.clientHeight;
    canvas.current!.height = height;
    canvas.current!.width = width;

    img.current = new Image();

    var serializer = new XMLSerializer();

    const svg = containerRef.current?.querySelector('svg');
    // console.log(svgRef.current);
    var str = serializer.serializeToString(svg!);
    img.current.src = 'data:image/svg+xml;base64,' + btoa(str);
    // img.current.src = 'public/work/illustrated-cards/Back.svg';
  }, [cardSrc]);

  useAnimationFrame((t) => {
    if (!ctx.current) return;
    if (!img.current?.complete) return;

    // 30fps
    if (t - tickDiffRef.current < 1000 / 120) return;
    tickDiffRef.current = t;

    if (!state.current) {
      state.current = init();
      return;
    }

    updatePosition(
      state.current.card,
      0.5,
      0.99,
      state.current.velocity,
      canvas.current!,
      cardSize.height,
    );

    ctx.current!.drawImage(
      img.current,
      state.current.card[0],
      state.current.card[1],
      cardSize.width,
      cardSize.height,
    );

    if (state.current.card[0] > canvas.current!.width || state.current.card[0] < -cardSize.width) {
      state.current = init();
    }
  });

  return (
    <div ref={containerRef} className="contents">
      <BackSVG
        style={
          theme.theme === 'light'
            ? {
                color: 'black',
                background: 'white',
              }
            : { color: 'white', fill: 'black' }
        }
        className="hidden"
      />
      <canvas ref={canvas} className="h-full w-full bg-main-background"></canvas>;
    </div>
  );
}
