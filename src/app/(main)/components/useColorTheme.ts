import { useTheme } from 'next-themes';
import { useEffect, useSyncExternalStore } from 'react';

export const colorThemes = ['red', 'green', 'blue'] as const;

export type ColorTheme = (typeof colorThemes)[number];

function getMainEl() {
  return document.querySelector(':root')!;
}

const defaultThemes = ['theme-light', 'theme-dark'];

function getThemeClassnames() {
  return Array.from(getMainEl()?.classList.values()! || []).filter(
    (c) => c.startsWith('theme-') && !defaultThemes.includes(c),
  );
}

function getColorThemeFromClass(classList: string[]): ColorTheme | undefined {
  const theme = classList.find((c) => c.startsWith('theme-'));

  if (!theme) {
    return undefined;
  }

  const colorTheme = theme.split('-')[1] as ColorTheme;
  if (!colorThemes.includes(colorTheme)) {
    return undefined;
  }

  return colorTheme;
}

function subscribe(cb: () => void) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const classUpdated =
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class' &&
        mutation.oldValue !== (mutation.target as HTMLElement).className;

      if (classUpdated) {
        cb();
      }
    });
  });

  observer.observe(getMainEl(), {
    attributeFilter: ['class'],
  });

  observer.takeRecords();

  return () => {
    observer.disconnect();
  };
}

function removeColorTheme() {
  const mainEl = getMainEl();
  const themes = getThemeClassnames();

  for (const t of themes) {
    withDisabledTransitions(() => {
      mainEl?.classList.remove(t);
    });
  }
}

function getSnapshot() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return getColorThemeFromClass(getThemeClassnames());
}

function withDisabledTransitions(cb: () => void) {
  const style = document.createElement('style');

  style.innerHTML = '* { transition: none !important; }';

  document.head.appendChild(style);
  window.getComputedStyle(document.body);

  cb();

  setTimeout(() => {
    document.head.removeChild(style);
  }, 0);
}

export default function useColorTheme() {
  const { resolvedTheme } = useTheme();

  // treat the DOM as a source of truth
  const colorTheme = useSyncExternalStore(subscribe, getSnapshot, () => undefined);

  useEffect(() => {
    removeColorTheme();

    const mainEl = getMainEl();
    if (colorTheme) {
      withDisabledTransitions(() => {
        mainEl?.classList.add(`theme-${colorTheme}`, `theme-${colorTheme}-${resolvedTheme}`);
      });
    }

    return () => {
      removeColorTheme();
    };
  }, [colorTheme, resolvedTheme]);

  function setColorTheme(theme: ColorTheme) {
    removeColorTheme();

    const mainEl = getMainEl();
    mainEl?.classList.add(`theme-${theme}-${resolvedTheme}`);
  }

  return {
    colorTheme,
    setColorTheme,
    removeColorTheme,
  };
}
