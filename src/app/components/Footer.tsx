import { ReactNode } from 'react';

import { LettersIcon } from '~/src/components/icons';

import FloatingNav from './FloatingNav';

export default function Footer({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="nav sticky bottom-5 z-[11] mx-auto mb-5 rounded-full md:fixed md:bottom-8 md:left-1/2 md:mb-0 md:-translate-x-1/2">
        <FloatingNav />
      </div>
      <footer className="z-10 flex justify-between px-5 pb-4 text-text-primary md:pb-8">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-main-theme-3 p-2">
            <LettersIcon />
          </div>
          <span className="text-xs [&_a]:underline">
            <a
              href="https://fonts.google.com/specimen/Archivo"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm"
            >
              Archivo
            </a>
            , paired with{' '}
            <a
              href="https://fonts.google.com/specimen/Inter"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm"
            >
              Inter
            </a>
            .
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          See code on
          <a
            href="https://github.com/buka-studio/www-marijanasimag"
            className="rounded-sm underline"
          >
            GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
