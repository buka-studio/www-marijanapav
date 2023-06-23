'use client';

import clsx from 'clsx';
import { useTheme } from 'next-themes';
import { useEffect, useLayoutEffect, useRef } from 'react';
import './cards.css';
import useColorTheme from './useColorTheme';

const lerpFactor = 5;
const rafFPS = 8;
const factor = 10;
const pixelSize = 50;

type Pixel = {
  step: number;
};

type LerpPixel = {
  colorSteps: string[];
};

type Pixels = Array<Array<Pixel>>;
type LerpPixels = Array<Array<LerpPixel>>;

function addAlphaToHex(hex: string, alpha: number) {
  const hexAlpha = Math.round(alpha * 255).toString(16);
  return hex + hexAlpha;
}

function getStepColors() {
  const root = document.querySelector('.main')!;
  const styles = getComputedStyle(root);
  const alphas = [1, 1, 0.4, 0.2, 0.1];

  const colors = [
    styles.getPropertyValue('--main-theme-1'),
    styles.getPropertyValue('--main-theme-2'),
    styles.getPropertyValue('--main-theme-3'),
    styles.getPropertyValue('--main-theme-3'),
    styles.getPropertyValue('--main-theme-3'),
  ].map((c, i) => addAlphaToHex(c, alphas[i]));

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
  const newPerStep = pixels[0].length / (maxStep - 3);

  for (const row of pixels) {
    const uninit = row.filter((pixel) => pixel.step === 0).map((_, i) => i);
    const newlyInitIndices = pickRandomIndices(uninit, newPerStep);
    for (let c = 0; c < row.length; c++) {
      if (newlyInitIndices.includes(c) || row[c].step > 0) {
        row[c].step += steps % maxStep;
      }
    }
    shuffleInPlace(row);
  }
}

function lerpPixelColor(from: Pixels, to: Pixels) {
  const transitions: LerpPixels = [];
  const colors = getStepColors();

  for (let r = 0; r < from.length; r++) {
    const row: LerpPixel[] = [];
    for (let c = 0; c < from[r].length; c++) {
      const colorSteps = [];

      for (let i = 0; i < lerpFactor; i++) {
        const colorFrom = colors[from[r][c].step];
        const colorTo = colors[to[r][c].step];

        const step = lerpColor(colorFrom, colorTo, i / lerpFactor);

        colorSteps.push(step);
      }
      row.push({ colorSteps });
    }
    transitions.push(row);
  }

  return transitions;
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
        row.push({
          step: 0,
        });
      }
      pixels.push(row);
    }

    pixelsRef.current = pixels;
  }

  useLayoutEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    if (canvas.parentElement!.clientWidth < canvas.parentElement!.clientHeight) {
      canvas.style.height = '100%';
    } else {
      canvas.style.width = '100%';
    }
  }, []);

  const currRaf = useRef<ReturnType<typeof requestAnimationFrame>>();

  function rafNTimes(callback: () => void, n: number, fps: number) {
    let currN = 0;
    let lastFrameTime = 0;

    function loop(time: number) {
      const delta = time - lastFrameTime;
      if (delta > 1000 / fps) {
        callback();
        currN++;
        lastFrameTime = time;
      }

      if (currN < n) {
        currRaf.current = requestAnimationFrame(loop);
      }
    }

    currRaf.current = requestAnimationFrame(loop);
  }

  function drawLerpPixels(pixels: LerpPixels, canvas: HTMLCanvasElement) {
    const rowOffset = (canvas.clientWidth * factor) / pixelSize;
    const colOffset = (canvas.clientHeight * factor) / pixelSize;
    const ctx = canvas.getContext('2d')!;

    let step = 0;

    rafNTimes(
      () => {
        for (let r = 0; r < pixels.length; r++) {
          for (let c = 0; c < pixels[r].length; c++) {
            ctx.clearRect(r * rowOffset, c * colOffset, pixelSize * factor, pixelSize * factor);
            const color = pixels[r][c].colorSteps[step];
            ctx.fillStyle = color;
            ctx.fillRect(r * rowOffset, c * colOffset, pixelSize * factor, pixelSize * factor);
          }
        }
        step++;
      },
      lerpFactor,
      rafFPS,
    );
  }

  // todo: use useEffectEvent
  function redraw(from: number, steps: number) {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const colors = getStepColors();

    if (from === 0) {
      initPixels();

      ctx.fillStyle = colors[0];
      ctx.fillRect(0, 0, canvas.clientWidth * factor, canvas.clientHeight * factor);
    } else {
      const oldPixels = structuredClone(pixelsRef.current);

      advancePixels(pixelsRef.current, steps, maxSteps);

      const lerpPixels = lerpPixelColor(oldPixels, pixelsRef.current);

      cancelAnimationFrame(currRaf.current!);
      drawLerpPixels(lerpPixels, canvas);
    }
  }

  useEffect(() => {
    redraw(step, 1);
  }, [step, maxSteps]);

  useEffect(() => {
    redraw(step, 0);
  }, [step, colorTheme, resolvedTheme]);

  useEffect(() => {
    const resizeHandler = () => {
      const canvas = canvasRef.current!;
      if (!canvas) return;

      canvas.style.width = '';
      canvas.style.height = '';
      if (canvas.parentElement!.clientWidth < canvas.parentElement!.clientHeight) {
        canvas.style.height = '100%';
      } else {
        canvas.style.width = '100%';
      }

      const ctx = canvas.getContext('2d')!;
      const colors = getStepColors();

      if (step === 0) {
        initPixels();

        ctx.fillStyle = colors[0];
        ctx.fillRect(0, 0, canvas.clientWidth * factor, canvas.clientHeight * factor);
      } else {
        initPixels();

        const oldPixels = structuredClone(pixelsRef.current);

        advancePixels(pixelsRef.current, step, maxSteps);

        const lerpPixels = lerpPixelColor(oldPixels, pixelsRef.current);

        cancelAnimationFrame(currRaf.current!);
        drawLerpPixels(lerpPixels, canvas);
      }
    };
    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, [step]);

  const revealed = step === maxSteps;

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={clsx(
          'absolute top-0 left-0 aspect-square rounded-xl transition-all ease-linear duration-300',
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
