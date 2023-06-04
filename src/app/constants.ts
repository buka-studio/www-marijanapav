export type GrayscaleTheme = 'light' | 'dark';
export type ColoredTheme = 'blue' | 'red' | 'green';

export type Theme = GrayscaleTheme | `${ColoredTheme}-${GrayscaleTheme}`;

export type ThemeClassName<T extends Theme = Theme> = `theme-${T extends GrayscaleTheme
  ? T
  : `${T}-${GrayscaleTheme}`}`;
