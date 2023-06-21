'use client';

import clsx from 'clsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import photo from '~/public/home/sneak_peek.png';
import { EyeIcon, EyeOffIcon } from '~/src/components/icons';
import Card from '~/src/components/ui/Card';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';

import './cards.css';

const maxClicks = 5;

const submitClicks = (amount: number) => {
  const params = new URLSearchParams([
    ['pathname', '/#sneak-peek'],
    ['type', 'action'],
  ]).toString();

  return fetch('/api/stats?' + params, {
    method: 'POST',
    body: JSON.stringify({
      amount,
    }),
  });
};

type Pixel = {
  step: number;
};

type Pixels = Array<Array<Pixel>>;

function getStepColors() {
  const root = document.querySelector('.main')!;
  const styles = getComputedStyle(root);
  const colors = [
    styles.getPropertyValue('--main-theme-1'),
    styles.getPropertyValue('--main-theme-2'),
    styles.getPropertyValue('--main-theme-3') + '50',
    styles.getPropertyValue('--main-theme-3') + '30',
    styles.getPropertyValue('--main-theme-3') + '10',
  ];
  return colors;
}

function shuffle<T>(arr: T[]): T[] {
  const newArr = [...arr];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
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

function transitionPixels(pixels: Pixels) {
  const newPerStep = pixels[0].length / (maxClicks - 3);

  for (const row of pixels) {
    const uninit = row.filter((pixel) => pixel.step === 0).map((_, i) => i);
    const newlyInitIndices = pickRandomIndices(uninit, newPerStep);
    for (let c = 0; c < row.length; c++) {
      if (newlyInitIndices.includes(c) || row[c].step > 0) {
        row[c].step += 1;
      }
    }
    shuffleInPlace(row);
  }
}

function drawPixels(pixels: Pixels, canvas: HTMLCanvasElement, colors: string[]) {
  const rowOffset = (canvas.clientWidth * factor) / pixelSize;
  const colOffset = (canvas.clientHeight * factor) / pixelSize;
  const ctx = canvas.getContext('2d')!;

  for (let r = 0; r < pixels.length; r++) {
    for (let c = 0; c < pixels[r].length; c++) {
      ctx.clearRect(r * rowOffset, c * colOffset, pixelSize * factor, pixelSize * factor);
      const color = colors[pixels[r][c].step];
      ctx.fillStyle = color;
      ctx.fillRect(r * rowOffset, c * colOffset, pixelSize * factor, pixelSize * factor);
    }
  }
}

const factor = 10;
const pixelSize = 50;

export default function SneakPeekCard({ currentCount }: { currentCount: number }) {
  const [clickCount, setClickCount] = useState(0);
  const cycleClickCount = clickCount % (maxClicks + 1);

  const countRef = useRef(clickCount);
  const submitted = useRef(clickCount);

  const revealed = cycleClickCount === maxClicks;

  useEffect(() => {
    countRef.current = clickCount;
    if (revealed) {
      submitClicks(clickCount - submitted.current).then(() => {
        submitted.current = clickCount;
      });
    }
  }, [revealed, clickCount]);

  useEffect(() => {
    return () => {
      if (countRef.current > submitted.current) {
        submitClicks(countRef.current);
      }
    };
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelRef = useRef<Pixels>([]);

  function initPixels() {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvasRef.current!.getContext('2d');

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

    pixelRef.current = pixels;
  }

  useLayoutEffect(() => {
    if (!canvasRef.current) return;
    if (
      canvasRef.current.parentElement!.clientWidth < canvasRef.current.parentElement!.clientHeight
    ) {
      canvasRef.current.style.height = '100%';
    } else {
      canvasRef.current.style.width = '100%';
    }
    const colors = getStepColors();
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const colors = getStepColors();

    if (cycleClickCount === 0) {
      initPixels();
      ctx.fillStyle = colors[0];
      ctx.fillRect(0, 0, canvas.clientWidth * factor, canvas.clientHeight * factor);
    } else if (cycleClickCount === maxClicks) {
      ctx.clearRect(0, 0, canvas.clientWidth * factor, canvas.clientHeight * factor);
    } else {
      transitionPixels(pixelRef.current);
      drawPixels(pixelRef.current, canvas, colors);
    }
  }, [cycleClickCount]);

  useLayoutEffect(() => {}, []);

  return (
    <Card className="flex flex-col">
      <div className="mb-2 text-text-secondary">What I&apos;m working on atm</div>
      <div className="flex items-start justify-between mb-[120px]">
        <Heading as="h1" className="text-primary text-6xl">
          Sneak
          <br />
          peek
        </Heading>
      </div>
      <div className="progress relative mb-2 rounded-full bg-main-theme-overlay pr-2">
        <div
          className="progress-bar absolute bg-main-theme-2 rounded-full h-full min-w-[130px] transition-all duration-300"
          style={
            {
              width: `calc(130px + ((100% - 130px) / ${maxClicks}) * ${Math.min(
                cycleClickCount,
                maxClicks,
              )})`,
            } as React.CSSProperties
          }
        />
        <button
          className="bg-main-theme-2 rounded-full flex items-center gap-2 relative py-[4px] px-2 text-sm w-[130px]"
          onClick={() => {
            setClickCount((c) => c + 1);
          }}
        >
          {revealed ? <EyeIcon className="w-5 h-5" /> : <EyeOffIcon className="w-5 h-5" />}
          Click to {revealed ? 'hide' : 'see'}
        </button>
        <span
          className={clsx(
            'absolute right-2 top-[4px] transition-all duration-[500ms] ease-out text-sm',
            {
              ['-translate-x-4 opacity-0 ']: !revealed,
              ['opacity-100 translate-x-0']: revealed,
            },
          )}
        >
          {currentCount + clickCount} clicks
        </span>
      </div>

      <div className="w-full min-h-[284px] relative rounded-xl overflow-hidden">
        <Image
          src={photo.src}
          alt={''}
          key={photo.src}
          fill
          className={clsx('object-cover object-center transition-all duration-200', {
            'grayscale-0 blur-0': revealed,
            'grayscale blur-md': !revealed,
          })}
        />
        <canvas
          ref={canvasRef}
          className={clsx(
            'absolute top-0 left-0 aspect-square rounded-xl transition-all duration-200',
          )}
          width={2000}
          height={2000}
        />
      </div>
    </Card>
  );
}
