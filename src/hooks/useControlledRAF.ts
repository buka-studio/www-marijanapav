import { useCallback, useMemo, useRef } from 'react';

type Controls = {
  start(): void;
  stop(): void;
};

export default function useControlledRAF(callback: FrameRequestCallback): Controls {
  const raf = useRef<number | null>(null);
  const active = useRef<boolean>(false);
  const cb = useRef(callback);
  cb.current = callback;

  const step = useCallback((time: number) => {
    if (active.current) {
      cb.current(time);
      raf.current = requestAnimationFrame(step);
    }
  }, []);

  const controls = useMemo(
    () => ({
      start: () => {
        if (!active.current) {
          active.current = true;
          raf.current = requestAnimationFrame(step);
        }
      },
      stop: () => {
        if (active.current) {
          active.current = false;
          raf.current && cancelAnimationFrame(raf.current);
        }
      },
    }),
    [],
  );

  return controls;
}
