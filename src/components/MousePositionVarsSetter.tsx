'use client';

import { useEffect } from 'react';

export const relativeMouseClassname = 'relative-mouse';

export default function MousePositionVarsSetter() {
  useEffect(() => {
    const handler = ({ clientX, clientY }: MouseEvent) => {
      const shinyCards = document.querySelectorAll('.' + relativeMouseClassname);
      const targetBCRs = Array.from(shinyCards || []).map((el) => ({
        el: el as HTMLElement,
        bcr: el.getBoundingClientRect(),
      }));

      for (const { el, bcr } of targetBCRs) {
        const x = clientX - bcr.left;
        const y = clientY - bcr.top;

        el.style.setProperty(`--mouse-x`, `${x}px`);
        el.style.setProperty(`--mouse-y`, `${y}px`);
      }
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handler);
    };
  }, []);

  return null;
}
