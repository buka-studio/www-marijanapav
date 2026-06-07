'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      disableTransitionOnChange
      value={{
        light: 'theme-light',
        dark: 'theme-dark',
      }}
      scriptProps={{
        'data-cfasync': 'false',
        type: 'application/json',
      }}
      attribute="class"
    >
      {children}
    </NextThemeProvider>
  );
}
