import Image from 'next/image';
import { ComponentProps, useEffect, useState } from 'react';

import { cn } from '~/src/util';

import PostageDue from './PostageDue.svg';

const MAX_CHARS = 300;

const addressLines = ['Robert and Marijana', 'Digital Stamp Collection HQ', 'Feedback Dept.'];
const placeholders = [
  `hey hi — can we get a Kamakura stamp on the site? big buddha energy pls. ok bye`,
  `hello!! dropping in to request a Himeji stamp because that castle is unreal. ty in advance lol`,
  `yo can you make a Miyajima stamp? floating torii gate supremacy. ok thanks bye`,
  `hi from the adriatic enjoyer community — pls add a Rab stamp?? would be iconic. thx`,
  `hey! any chance for a Bali stamp? beaches + temples + chaos monkeys? would love it.`,
  `hiii can we get a Koh Samui stamp?? i need the palm-tree vibes on your site. ty!!`,
  `hello internet person — requesting a Singapore stamp. skyline, food, absolute efficiency. pls add`,
  `hey! can you add a CDMX / Teotihuacán stamp?? pyramids + city energy = need. ok bye`,
  `hi hi — any chance for an Amsterdam stamp? canals, bikes, cute houses… the works. thx :)`,
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
        'grid grid-cols-[1fr_auto] grid-rows-[1fr_1fr_auto] gap-x-5 rounded-[2px] border border-stone-200 bg-stone-100 p-3 sm:grid-cols-[1fr_1fr] sm:gap-x-6 sm:p-4 sm:px-6',
        className,
      )}
      {...props}
    >
      <div className="col-[1/3] row-[2] border-t border-dashed border-stone-200 py-3 pb-12 sm:col-[1] sm:row-span-3 sm:border-r sm:border-t-0 sm:py-5 sm:pb-5 sm:pr-5">
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
            name="message"
            aria-label="Postcard message"
            maxLength={MAX_CHARS}
            id="message"
            className="absolute inset-0 h-full w-full resize-none bg-transparent font-[cursive] text-base leading-relaxed text-stone-500 caret-gray-700 placeholder:text-stone-400 focus:outline-none sm:text-lg"
            placeholder={placeholder}
          />
        </div>
      </div>
      <div className="col-[2] row-[1] flex items-start justify-end">
        <div className="relative h-[120px] w-[90px] border border-stone-300">
          <Image
            className="absolute right-1 top-1 h-full w-full rotate-3 object-contain"
            src="/stamps/penny_black.png"
            alt="Marijana & Robert Penny Black Stamp"
            unoptimized
            width={90}
            height={120}
          />
          <PostageDue className="absolute -bottom-1/2 -left-1/2 text-stone-600" />
        </div>
      </div>
      <div className="justify-start-start col-[1] row-[1] flex flex-col gap-2 sm:col-[2] sm:row-[2] sm:justify-center">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[1em] w-full border-b border-stone-200 font-[monospace] text-[0.625rem] uppercase text-stone-500 sm:text-xs"
          >
            {addressLines[i] || ''}
          </div>
        ))}
      </div>

      <div className="col-[1/3] row-[3] flex justify-between text-[0.5rem] text-stone-400 sm:col-[2] sm:block sm:text-[0.65rem]">
        {footer}
      </div>

      {children}
    </form>
  );
}
