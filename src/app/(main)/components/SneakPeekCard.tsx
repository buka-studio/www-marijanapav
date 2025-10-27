'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import SneakPeekPhoto from '~/public/home/sneak_peek-3.png';
import { EyeIcon, EyeOffIcon } from '~/src/components/icons';
import CardTitle from '~/src/components/ui/CardTitle';
import Image from '~/src/components/ui/Image';
import { cn } from '~/src/util';

import Card from './Card';

import './cards.css';

import { AnimatePresence, motion } from 'framer-motion';

import TextLink from '~/src/components/ui/TextLink';
import { remap } from '~/src/math';

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

  const handleClick = () => {
    setClickCount((c) => c + 1);
  };

  return (
    <Card className="flex flex-col">
      <CardTitle variant="mono" className="mb-2">
        In Progress
      </CardTitle>
      <div className="mb-20 flex items-start justify-between  xl:mb-[120px]">
        <div className="font-archivo text-3xl md:text-4xl">
          Sneak <br className="hidden md:block" />
          peek
        </div>
      </div>
      <div className="relative flex flex-col gap-4">
        <AnimatePresence>
          {revealed && (
            <motion.p
              className="absolute bottom-[calc(100%+16px)] mt-2 text-sm text-text-primary [text-wrap:pretty]"
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.3 }}
            >
              Follow on{' '}
              <TextLink
                href="https://twitter.com/marijanapav"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </TextLink>{' '}
              for more in-progress pieces like this one.{' '}
            </motion.p>
          )}
        </AnimatePresence>
        <div className="progress relative mb-4 rounded-full bg-panel-overlay pr-2 text-text-contrast">
          <div
            className="progress-bar absolute h-full min-w-[130px] rounded-full bg-text-primary transition-all duration-300"
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
            className="relative flex w-[130px] items-center gap-2 rounded-full bg-text-primary px-2 py-[4px] text-sm text-text-contrast"
            onClick={handleClick}
          >
            {revealed ? <EyeIcon className="h-5 w-5" /> : <EyeOffIcon className="h-5 w-5" />}
            Click to {revealed ? 'hide' : 'see'}
          </button>
          <span
            className={cn(
              'duration-[500ms] absolute right-2 top-[4px] text-sm transition-all ease-out',
              {
                '-translate-x-4 opacity-0 ': !revealed,
                'translate-x-0 opacity-100': revealed,
              },
            )}
          >
            {currentCount + clickCount} clicks
          </span>
        </div>
      </div>

      <div className="relative h-full min-h-[284px] w-full overflow-hidden rounded-md">
        <Image
          src={SneakPeekPhoto}
          // todo: better alt text
          alt="A sneak peek of my current project"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px): 50vw, 284px"
          placeholder="blur"
          style={
            {
              filter: `grayscale(${remap(cycleClickCount, 0, maxClicks, 100, 0)}%) blur(${remap(
                cycleClickCount,
                0,
                maxClicks,
                5,
                0,
              )}px)`,
            } as React.CSSProperties
          }
          className={cn('object-cover object-center transition-all duration-300')}
        />

        <PixelatedReveal step={cycleClickCount} maxSteps={maxClicks} />
      </div>
    </Card>
  );
}
