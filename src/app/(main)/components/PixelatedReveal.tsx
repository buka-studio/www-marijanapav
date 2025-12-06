'use client';

import { useTheme } from 'next-themes';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

import './cards.css';

import useResizeRef from '~/src/hooks/useResizeRef';
import { cn, oklabToHex } from '~/src/util';

import useColorTheme from './useColorTheme';

const lerpFactor = 5;
const rafFPS = 10;
const factor = 10;
const pixelSize = 50;

type Pixels = Array<Array<number>>;

function addAlphaToHex(hex: string, alpha: number) {
  const hexAlpha = Math.round(alpha * 255).toString(16);
  return hex + hexAlpha;
}

function getCurrColorsForSteps() {
  const root = document.querySelector(':root')!;
  const styles = getComputedStyle(root);
  const alphas = [1, 1, 0.6, 0.4, 0.2, 0.1];

  const colors = [
    styles.getPropertyValue('--theme-1'),
    styles.getPropertyValue('--theme-2'),
    styles.getPropertyValue('--theme-2'),
    styles.getPropertyValue('--theme-3'),
    styles.getPropertyValue('--theme-3'),
    styles.getPropertyValue('--theme-3'),
  ].map((c, i) => addAlphaToHex(oklabToHex(c!)!, alphas[i]));

  return colors;
}

function channelToHex(channel: number) {
  const hex = channel.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

const hexToRgb = (hex: string): [number, number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);

  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        parseInt(result[4], 16),
      ]
    : [0, 0, 0, 0];
};

function lerpColor(color1: string, color2: string, factor: number) {
  const [r1, g1, b1, a1] = hexToRgb(color1);
  const [r2, g2, b2, a2] = hexToRgb(color2);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  const a = Math.round(a1 + (a2 - a1) * factor);

  return '#' + [r, g, b, a].map(channelToHex).join('');
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffle<T>(arr: T[]): T[] {
  return shuffleInPlace([...arr]);
}

function pickRandomIndices(arr: number[], amount: number): number[] {
  if (arr.length <= amount) return arr;

  const indices: number[] = [];
  while (indices.length < amount) {
    const index = Math.floor(Math.random() * arr.length);
    if (!indices.includes(index)) {
      indices.push(index);
    }
  }
  return indices;
}

function advancePixels(pixels: Pixels, steps: number, maxStep: number) {
  let wipPixels = structuredClone(pixels);

  const newPerStep = wipPixels[0].length / (maxStep - 3);

  for (let r = 0; r < wipPixels.length; r++) {
    let row = wipPixels[r];
    const uninit = row.filter((pixel) => pixel === 0).map((_, i) => i);
    const newlyInitIndices = pickRandomIndices(uninit, newPerStep);
    for (let c = 0; c < row.length; c++) {
      if (newlyInitIndices.includes(c) || row[c] > 0) {
        row[c] += steps % maxStep;
      }
    }
    wipPixels[r] = shuffle(row);
  }

  return wipPixels;
}

function drawPixels(
  pixels: Pixels,
  canvas: HTMLCanvasElement,
  getColor?: (r: number, c: number) => string,
  shape: 'circle' | 'square' = 'square',
) {
  const rowOffset = Math.floor((canvas.clientWidth * factor) / pixelSize);
  const colOffset = Math.floor((canvas.clientHeight * factor) / pixelSize);

  const ctx = canvas.getContext('2d')!;

  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      ctx.clearRect(r * rowOffset, c * colOffset, pixelSize * factor, pixelSize * factor);
      if (shape === 'square') {
        ctx.fillStyle = getColor?.(r, c) || getCurrColorsForSteps()[pixels[r][c]];
        ctx.fillRect(r * rowOffset, c * colOffset, pixelSize * factor, pixelSize * factor);
      } else if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(r * rowOffset, c * colOffset, rowOffset / 2, 0, 2 * Math.PI);
        ctx.fillStyle = getColor?.(r, c) || getCurrColorsForSteps()[pixels[r][c]];
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

export default function PixelatedReveal({ step, maxSteps }: { step: number; maxSteps: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixels>([]);

  const { colorTheme } = useColorTheme();
  const { resolvedTheme } = useTheme();

  function initPixels() {
    const canvas = canvasRef.current!;

    const height = canvas.clientHeight;
    const width = canvas.clientWidth;

    canvas.width = width * factor;
    canvas.height = height * factor;

    const rows = (width * factor) / pixelSize;
    const cols = (height * factor) / pixelSize;

    const pixels = [];

    for (let c = 0; c < cols; c++) {
      const row = [];
      for (let r = 0; r < rows; r++) {
        row.push(0);
      }
      pixels.push(row);
    }

    pixelsRef.current = pixels;
  }

  const currRaf = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const rafNTimes = useCallback((callback: (currN: number) => void, n: number, fps: number) => {
    let currN = 0;
    let lastFrameTime = 0;

    function loop(time: number) {
      const delta = time - lastFrameTime;
      if (delta > 1000 / fps) {
        callback(currN);
        currN++;
        lastFrameTime = time;
      }

      if (currN < n) {
        currRaf.current = requestAnimationFrame(loop);
      }
    }

    currRaf.current = requestAnimationFrame(loop);
  }, []);

  const drawPixelsTransition = useCallback(
    (from: Pixels, to: Pixels, canvas: HTMLCanvasElement) => {
      rafNTimes(
        (step) => {
          const colors = getCurrColorsForSteps();
          drawPixels(from, canvas, (r, c) => {
            return lerpColor(colors[from[r][c]], colors[to[r][c]], step / lerpFactor);
          });
        },
        lerpFactor,
        rafFPS,
      );
    },
    [rafNTimes],
  );

  const { ref, dimensions } = useResizeRef<HTMLDivElement>();
  useLayoutEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) {
      return;
    }
    if (dimensions.width === 0 || dimensions.height === 0) {
      return;
    }

    canvas.style.width = '';
    canvas.style.height = '';
    if (dimensions.width < dimensions.height) {
      canvas.style.height = '100%';
    } else {
      canvas.style.width = '100%';
    }

    initPixels();

    const newPixels = advancePixels(pixelsRef.current, step || 1, maxSteps);
    drawPixels(newPixels, canvas);

    pixelsRef.current = newPixels;
  }, [dimensions.width, dimensions.height, maxSteps]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!(canvas && pixelsRef.current?.length)) {
      return;
    }

    if (step === 0) {
      initPixels();
    }

    let newPixels = advancePixels(pixelsRef.current, 1, maxSteps);
    cancelAnimationFrame(currRaf.current!);
    drawPixelsTransition(pixelsRef.current, newPixels, canvas);

    pixelsRef.current = newPixels;
  }, [step, maxSteps, drawPixelsTransition]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) {
      return;
    }

    drawPixels(pixelsRef.current, canvas);
  }, [colorTheme, resolvedTheme]);

  const revealed = step === maxSteps;

  return (
    <div className="relative h-full w-full" ref={ref}>
      <div
        className={cn('bg-main-theme-overlay absolute top-0 left-0 h-full w-full opacity-50', {
          'opacity-0': revealed,
        })}
      />
      <canvas
        ref={canvasRef}
        className={cn(
          'absolute top-0 left-0 aspect-square rounded-md transition-all duration-300 ease-linear',
          {
            'opacity-0': revealed,
            'opacity-100': !revealed,
          },
        )}
        width={2000}
        height={2000}
      />
    </div>
  );
}
