'use client';

import { useEffect } from 'react';

const listenerOptions = {
  passive: true,
};

function debounceCallback(callback: () => void, limitMs: number) {
  let timeout: ReturnType<typeof setTimeout>;

  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(callback, limitMs);
  };
}

export const dvh100 = `calc(var(--vh, 1vh) * 99.99)`;

export default function DynamicVHVarsSetter() {
  useEffect(() => {
    let mounted = true;
    const update = () => {
      if (!mounted) {
        return;
      }
      const vh = window.innerHeight * 0.01;
      document.body.style.setProperty('--vh', `${vh}px`);
    };

    update();

    const debounced = debounceCallback(update, 200);

    window.addEventListener('resize', debounced, listenerOptions);
    return () => {
      mounted = false;
      window.removeEventListener('resize', debounced);
    };
  }, []);

  return null;
}
