import { useLayoutEffect, useRef, useState } from 'react';

export default function useResizeRef<T extends HTMLElement>(once?: boolean) {
  const ref = useRef<T>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const measured = useRef(false);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    if (once && measured.current) {
      return;
    }

    if (ref.current) {
      setDimensions({
        width: ref.current.clientWidth,
        height: ref.current.clientHeight,
      });

      measured.current = true;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setDimensions({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [once]);

  return { ref, dimensions };
}
