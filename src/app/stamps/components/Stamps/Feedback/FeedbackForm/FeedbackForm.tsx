import Image from 'next/image';
import { ComponentProps, useEffect, useState } from 'react';

import { cn } from '~/src/util';

import PostageDue from './PostageDue.svg';

const MAX_CHARS = 300;

const addressLines = ['Robert and Marijana', 'Digital Stamp Collection HQ', 'Feedback Dept.'];
const placeholders = [
  `hey hi, can we get a Kamakura stamp on the site? big buddha energy pls. ok bye`,
  `hello!! dropping in to request a Himeji stamp because that castle is unreal. ty in advance, greetings from Japan!`,
  `Can you make a Miyajima stamp? floating torii gate would be crazy good! thankyouu bye`,
  `Hi from the adriatic enjoyer! Can you add a Rab stamp?? Greetings from Croatia :)`,
  `hey! any chance for a Bali stamp? beaches + temples + chaos monkeys? would love it.`,
  `hiii can we get a Koh Samui stamp?? i need the palm-tree vibes ty!!`,
  `hello, requesting a Singapore stamp: skyline, food markets, merlion, gardens by the bay, that kinda thing!`,
  `Heyyo from CDMX! Can you add a Teotihuacán stamp, Pyramid of the Moon! `,
  `hi hi you're missing an Amsterdam stamp, canals, bikes, windmills :) can you add?`,
];

export default function FeedbackForm({
  className,
  children,
  footer,
  ...props
}: ComponentProps<'form'> & { footer?: React.ReactNode }) {
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    setPlaceholder(placeholders[Math.floor(Math.random() * placeholders.length)]);
  }, []);

  return (
    <form
      className={cn(
        'grid grid-cols-[1fr_auto] grid-rows-[1fr_1fr_auto] gap-x-5 rounded-[2px] border border-stone-200 bg-stone-100 p-3 pb-4 sm:grid-cols-[1fr_1fr] sm:gap-x-6 sm:p-4 sm:px-6',
        className,
      )}
      {...props}
    >
      <div className="relative col-[1/3] row-2 py-3 pb-8 sm:col-1 sm:row-span-3 sm:py-5 sm:pr-5 sm:pb-5">
        <div className="relative h-full w-full" data-no-tilt>
          <input
            type="text"
            name="hp"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="sr-only"
          />
          <textarea
            required
            name="message"
            aria-label="Postcard message"
            maxLength={MAX_CHARS}
            id="message"
            className={cn("absolute inset-0 h-full w-full resize-none bg-transparent font-[cursive] text-lg leading-relaxed caret-gray-700 placeholder:text-stone-400 focus:outline-none placeholder-shown:text-stone-400 text-stone-700")}
            placeholder={placeholder}
            autoFocus
          />
        </div>
        <svg className="absolute top-0 h-[2px] w-full text-stone-300 sm:right-0 sm:h-full sm:w-[2px]">
          <line
            className="sm:hidden"
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <line
            className="hidden sm:block"
            x1="0"
            y1="0"
            x2="0"
            y2="100%"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      </div>

      <div className="col-2 row-1 flex items-start justify-end">
        <div className="relative h-[120px] w-[90px] border border-stone-300">
          <Image
            className="absolute top-1 right-1 h-full w-full"
            src="/stamps/penny_black.png"
            alt="Marijana & Robert Penny Black Stamp"
            unoptimized
            width={90}
            height={120}
          />
          <PostageDue className="absolute -bottom-1/2 -left-1/2 text-stone-600" />
        </div>
      </div>
      <div className="justify-start-start col-1 row-1 flex flex-col gap-2 sm:col-2 sm:row-2 sm:justify-center">
        {addressLines.map((_, i) => (
          <div
            key={i}
            className="min-h-[1em] w-full border-b border-stone-200 font-[monospace] text-[0.65rem] text-stone-600 uppercase sm:text-xs"
          >
            {addressLines[i] || ''}
          </div>
        ))}
      </div>

      <div className="col-[1/3] row-3 flex justify-center text-[0.5rem] text-stone-400 sm:col-2 sm:block sm:justify-between sm:text-[0.65rem]">
        {footer}
      </div>

      {children}
    </form>
  );
}
