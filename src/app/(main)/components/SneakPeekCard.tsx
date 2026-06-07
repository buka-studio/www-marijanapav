'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import SneakPeekPhoto from '~/public/home/sneak_peek-3.png';
import { EyeIcon, EyeOffIcon } from '~/src/components/icons';
import CardTitle from '~/src/components/ui/CardTitle';
import Image from '~/src/components/ui/Image';
import { useIncrementStatsMutation, useStatsQuery } from '~/src/lib/query/api';
import { cn } from '~/src/util';

import Card from './Card';

import './cards.css';

import { AnimatePresence, motion } from 'framer-motion';

import TextLink from '~/src/components/ui/TextLink';
import { remap } from '~/src/math';

const PixelatedReveal = dynamic(() => import('./PixelatedReveal'), { ssr: false });

const maxClicks = 5;

export default function SneakPeekCard({ currentCount }: { currentCount: number }) {
  const { data: stats } = useStatsQuery('/#sneak-peek', 'action', { count: currentCount });
  const { mutate: incrementStats } = useIncrementStatsMutation();
  const [clickCount, setClickCount] = useState(0);
  const [confirmedClickCount, setConfirmedClickCount] = useState(0);
  const cycleClickCount = clickCount % (maxClicks + 1);

  const countRef = useRef(clickCount);
  const submittedClickCount = useRef(clickCount);
  const confirmedClickCountRef = useRef(clickCount);

  const revealed = cycleClickCount === maxClicks;

  const submitClicksThrough = useCallback(
    (nextSubmittedClickCount: number) => {
      const amount = nextSubmittedClickCount - submittedClickCount.current;

      if (amount <= 0) {
        return;
      }

      const previousSubmittedClickCount = submittedClickCount.current;
      submittedClickCount.current = nextSubmittedClickCount;

      incrementStats(
        {
          pathname: '/#sneak-peek',
          type: 'action',
          amount,
        },
        {
          onSuccess: () => {
            confirmedClickCountRef.current = Math.max(
              confirmedClickCountRef.current,
              nextSubmittedClickCount,
            );
            setConfirmedClickCount(confirmedClickCountRef.current);
          },
          onError: () => {
            if (submittedClickCount.current === nextSubmittedClickCount) {
              submittedClickCount.current = previousSubmittedClickCount;
            }
          },
        },
      );
    },
    [incrementStats],
  );

  useEffect(() => {
    countRef.current = clickCount;
    if (revealed) {
      submitClicksThrough(clickCount);
    }
  }, [revealed, clickCount, submitClicksThrough]);

  useEffect(() => {
    return () => {
      if (countRef.current > submittedClickCount.current) {
        submitClicksThrough(countRef.current);
      }
    };
  }, [submitClicksThrough]);

  const handleClick = () => {
    setClickCount((c) => c + 1);
  };

  const persistedCount = stats?.count ?? currentCount;
  const pendingLocalClicks = Math.max(0, clickCount - confirmedClickCount);

  return (
    <Card className="flex flex-col">
      <CardTitle variant="mono" className="mb-2">
        In Progress
      </CardTitle>
      <div className="mb-20 flex items-start justify-between xl:mb-[120px]">
        <div className="font-archivo text-3xl md:text-4xl">
          Sneak <br className="hidden md:block" />
          peek
        </div>
      </div>
      <div className="relative flex flex-col gap-4">
        <AnimatePresence>
          {revealed && (
            <motion.p
              className="text-text-primary absolute bottom-[calc(100%+16px)] mt-2 text-sm text-pretty"
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
        <div className="progress bg-panel-overlay text-text-contrast relative mb-4 rounded-full pr-2">
          <div
            className="progress-bar bg-text-primary absolute h-full min-w-[130px] rounded-full transition-all duration-300"
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
            className="bg-text-primary text-text-contrast relative flex w-[130px] items-center gap-2 rounded-full px-2 py-[4px] text-sm"
            onClick={handleClick}
          >
            {revealed ? <EyeIcon className="h-5 w-5" /> : <EyeOffIcon className="h-5 w-5" />}
            Click to {revealed ? 'hide' : 'see'}
          </button>
          <span
            className={cn(
              'absolute top-[4px] right-2 text-sm transition-all duration-500 ease-out',
              {
                '-translate-x-4 opacity-0': !revealed,
                'translate-x-0 opacity-100': revealed,
              },
            )}
          >
            {persistedCount + pendingLocalClicks} clicks
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
