import { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono, Inter, Libertinus_Serif } from 'next/font/google';

import 'dialkit/styles.css';
import './globals.css';

import Script from 'next/script';

import { ThemeProvider } from './(main)/components/ThemeProvider';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-archivo',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-ibm-plex-mono',
});

const libertinusSerif = Libertinus_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-libertinus-serif',
});

const themeInitScript = `
(function() {
  try {
    var root = document.documentElement;
    var storedTheme = localStorage.getItem('theme');
    var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var theme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme;
    var className = theme === 'dark' ? 'theme-dark' : 'theme-light';

    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(className);
    root.style.colorScheme = theme;
  } catch (_) {}
})();
`;

export const metadata: Metadata = {
  title: "Marijana Pavlinić's Personal Website",
  metadataBase:
    process.env.NODE_ENV === 'production' ? new URL('https://marijanapav.com') : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${ibmPlexMono.variable} ${libertinusSerif.variable} font-sans`}
    >
      <head>
        <script
          data-cfasync="false"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
      </head>
      <body
        className={`${inter.variable} ${archivo.variable} ${ibmPlexMono.variable} ${libertinusSerif.variable} font-sans`}
      >
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
      </body>
      {process.env.NODE_ENV === 'production' && umamiWebsiteId && (
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id={umamiWebsiteId}
        />
      )}
    </html>
  );
}
