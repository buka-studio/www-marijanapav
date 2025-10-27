import { useEffect, useState } from 'react';

// todo: use syncExternalStore
export default function useMatchMedia(query: string, defaultState?: boolean) {
  const [state, setState] = useState(() => {
    if (defaultState !== undefined) {
      return defaultState;
    }

    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }

    return false;
  });

  useEffect(() => {
    let mounted = true;
    const media = window.matchMedia(query);
    const onChange = () => {
      if (!mounted) {
        return;
      }
      setState(Boolean(media.matches));
    };

    setState(media.matches);

    media.addEventListener('change', onChange);
    return () => {
      mounted = false;
      media.removeEventListener('change', onChange);
    };
  }, [query]);

  return state;
}
