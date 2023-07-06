import { ReactNode } from 'react';

import { LettersIcon } from '~/src/components/icons';

import FloatingNav from './FloatingNav';

export default function Footer({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="mb-5 md:mb-0 md:fixed sticky bottom-5 nav mx-auto md:bottom-8 md:left-1/2 md:-translate-x-1/2 rounded-full z-[11]">
        <FloatingNav />
      </div>
      <footer className="flex justify-between pb-4 md:pb-8 text-text-primary px-5 z-10">
        <div className="flex gap-2 items-center">
          <div className="rounded-full p-2 bg-main-theme-3">
            <LettersIcon />
          </div>
          <span className="[&_a]:underline text-xs">
            <a
              href="https://fonts.google.com/specimen/Archivo"
              target="_blank"
              rel="noopener noreferrer"
            >
              Archivo
            </a>
            , paired with{' '}
            <a
              href="https://fonts.google.com/specimen/Inter"
              target="_blank"
              rel="noopener noreferrer"
            >
              Inter
            </a>
            .
          </span>
        </div>

        <div className="text-xs flex gap-2 items-center">
          Built by{' '}
          <a href="https://rpavlini.com" className="underline">
            rpavlini.com
          </a>
        </div>
      </footer>
    </>
  );
}
