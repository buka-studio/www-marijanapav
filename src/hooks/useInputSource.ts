import { sourceOf } from '@ui-sdk/core';
import { useEffect } from 'react';

export default function useInputSource() {
  useEffect(() => {
    const root = document.documentElement;
    // starts ui-sdk's tracking, so its listeners run before ours
    sourceOf();

    const markInputSource = () => {
      root.setAttribute('data-input', sourceOf() === 'keyboard' ? 'keyboard' : 'pointer');
    };

    const events = ['keydown', 'pointerdown', 'touchstart'] as const;
    events.forEach((name) => {
      document.addEventListener(name, markInputSource, { capture: true, passive: true });
    });

    return () => {
      events.forEach((name) => {
        document.removeEventListener(name, markInputSource, { capture: true });
      });
      root.removeAttribute('data-input');
    };
  }, []);
}
