import { useEffect, useState } from 'react';

function readTheme() {
  return Array.from(document.documentElement.classList)
    .filter((name) => name.startsWith('theme-'))
    .sort()
    .join(' ');
}

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
