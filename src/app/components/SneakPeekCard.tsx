'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import photo from '~/public/home/sneak_peek.png';
import { EyeIcon, EyeOffIcon } from '~/src/components/icons';
import Card from '~/src/components/ui/Card';
import Heading from '~/src/components/ui/Heading';
import Image from '~/src/components/ui/Image';
import './cards.css';

const maxClicks = 3;

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
          className="object-cover object-center"
        />
        <div
          className="cover bg-main-theme-2 absolute left-0 top-0 w-full h-full transition-all duration-300"
          style={{
            opacity: revealed ? 0 : 1,
          }}
        />
      </div>
    </Card>
  );
}
