import Image from 'next/image';
import { ComponentProps } from 'react';

import { cn } from '~/src/util';

import PostageDue from './PostageDue.svg';

const MAX_CHARS = 300;

const addressLines = ['Robert and Marijana', 'Digital Stamp Collection HQ', 'Feedback Dept.'];

export default function FeedbackForm({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'grid grid-cols-[1fr_auto] grid-rows-[1fr_1fr_auto] gap-x-5 rounded-[2px] border border-stone-200 bg-stone-100 p-5 sm:grid-cols-[1fr_1fr] sm:gap-x-8 sm:px-8',
        className,
      )}
      {...props}
    >
      <form className="col-[1/3] row-[2] border-t border-dashed border-stone-200 py-5 sm:col-[1] sm:row-span-3 sm:border-r sm:border-t-0 sm:pr-5">
        <div className="relative h-full w-full">
          <textarea
            aria-label="Postcard message"
            maxLength={MAX_CHARS}
            id="message"
            className="font-caveat absolute inset-0 h-full w-full resize-none bg-transparent text-2xl leading-relaxed text-stone-500 caret-gray-700 placeholder:text-stone-400 focus:outline-none"
            placeholder="Hi, I'd like to request a stamp..."
          />
        </div>
      </form>
      <div className="col-[2] row-[1] flex items-start justify-end">
        <div className="relative h-[120px] w-[90px] border border-stone-300">
          <Image
            className="absolute right-1 top-1 h-full w-full rotate-3 object-contain"
            src="/stamps/penny_black.png"
            alt="Marijana & Robert Penny Black Stamp"
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
            className="min-h-[1em] w-full border-b border-stone-200 font-mono text-[0.625rem] uppercase text-stone-500 sm:text-xs"
          >
            {addressLines[i] || ''}
          </div>
        ))}
      </div>

      <div className="col-[1/3] row-[3] flex justify-between text-[0.5rem] text-stone-400 sm:col-[2] sm:block sm:text-[0.65rem]">
        <span className="font-mono uppercase">Buka Studio Production</span>
        <br className="hidden lg:block" />
        Uploaded to the internet from Croatia
      </div>
    </div>
  );
}
