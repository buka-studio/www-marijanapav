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
        width: Math.round(ref.current.clientWidth),
        height: Math.round(ref.current.clientHeight),
      });

      measured.current = true;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);

      setDimensions((current) =>
        current.width === width && current.height === height ? current : { width, height },
      );
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [once]);

  return { ref, dimensions };
}
