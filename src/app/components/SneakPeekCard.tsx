'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { EyeIcon, EyeOffIcon } from '~/src/components/icons';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';

import SneakPeekPhoto from '../../../public/home/sneak_peek_2.png';
import Card from './Card';

import './cards.css';

const PixelatedReveal = dynamic(() => import('./PixelatedReveal'), { ssr: false });

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

  return (
    <Card className="flex flex-col">
      <div className="mb-2 text-text-secondary">What I&apos;m working on atm</div>
      <div className="flex items-start justify-between mb-8 xl:mb-[120px]">
        <Heading as="h1" className="text-primary text-4xl md:text-5xl xl:text-6xl">
          Sneak <br className="hidden md:block" />
          peek
        </Heading>
      </div>
      <div className="progress relative mb-2 rounded-full bg-main-theme-overlay pr-2 text-text-alt2">
        <div
          className="progress-bar absolute bg-text-primary rounded-full h-full min-w-[130px] transition-all duration-300"
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
          className="bg-text-primary rounded-full flex items-center gap-2 relative py-[4px] px-2 text-sm w-[130px] text-text-alt2"
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

      <div className="w-full min-h-[284px] relative rounded-xl overflow-hidden h-full">
        <Image
          src={SneakPeekPhoto}
          // todo: better alt text
          alt="A sneak peek of my current project"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px): 50vw, 284px"
          placeholder="blur"
          className={clsx('object-cover object-center transition-all duration-300', {
            'grayscale-0 blur-0': revealed,
            'grayscale blur-sm': !revealed,
          })}
        />

        <PixelatedReveal step={cycleClickCount} maxSteps={maxClicks} />
      </div>
    </Card>
  );
}
