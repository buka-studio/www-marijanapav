import { sourceOf } from '@ui-sdk/core';
import { useEffect } from 'react';

// Says on the root how the reader is working: `data-input` is `keyboard` or `pointer`, by their
// last key or press. `:focus-visible` alone doesn't keep focus rings to the keyboard: focus that
// a script moves, as a dialog does, gets a ring in some browsers whatever asked for it.
export default function useInputSource() {
  useEffect(() => {
    const root = document.documentElement;
    // Asked first, so what tracks the reader's input hears each event before this does.
    sourceOf();

    const say = () => {
      root.setAttribute('data-input', sourceOf() === 'keyboard' ? 'keyboard' : 'pointer');
    };

    const events = ['keydown', 'pointerdown', 'touchstart'] as const;
    events.forEach((name) => {
      document.addEventListener(name, say, { capture: true, passive: true });
    });

    return () => {
      events.forEach((name) => {
        document.removeEventListener(name, say, { capture: true });
      });
      root.removeAttribute('data-input');
    };
  }, []);
}
