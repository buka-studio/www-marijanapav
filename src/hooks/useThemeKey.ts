import { useEffect, useState } from 'react';

function readTheme() {
  return Array.from(document.documentElement.classList)
    .filter((name) => name.startsWith('theme-'))
    .sort()
    .join(' ');
}

// A number that changes when the theme does (light, dark or its colour), but not on hydration.
// For a canvas or anything else that reads the page's styles once and has to be told to again.
export default function useThemeKey() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    let theme = readTheme();
    const observer = new MutationObserver(() => {
      const next = readTheme();
      if (next !== theme) {
        theme = next;
        setKey((current) => current + 1);
      }
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return key;
}
