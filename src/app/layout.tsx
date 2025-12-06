import { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono, Inter, Libertinus_Serif } from 'next/font/google';

import './globals.css';

import Script from 'next/script';

import { ThemeProvider } from './(main)/components/ThemeProvider';

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

export const metadata: Metadata = {
  title: "Marijana Pavlinić's Personal Website",
  metadataBase:
    process.env.NODE_ENV === 'production' ? new URL('https://marijanapav.com') : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${archivo.variable} ${ibmPlexMono.variable} ${libertinusSerif.variable} font-sans`}
    >
      <body
        className={`${inter.variable} ${archivo.variable} ${ibmPlexMono.variable} ${libertinusSerif.variable} font-sans`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
      {process.env.NODE_ENV === 'production' && (
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
        />
      )}
    </html>
  );
}
