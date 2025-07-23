import { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono, Inter, JetBrains_Mono } from 'next/font/google';

import Footer from './components/Footer';
import { ThemeProvider } from './components/ThemeProvider';

import './globals.css';

import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-archivo',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-ibm-plex-mono',
});

export const metadata: Metadata = {
  title: "Marijana Pavlinić's Personal Website",
  metadataBase:
    process.env.NODE_ENV === 'production' ? new URL('https://marijanapav.com') : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="">
      <body
        className={`${inter.variable} ${archivo.variable} ${jetbrainsMono.variable} ${ibmPlexMono.variable} font-sans`}
      >
        <ThemeProvider>
          <div className="main bg-main-background">
            <div className="m-auto flex min-h-screen max-w-screen-2xl flex-col">
              {children}
              <Footer />
            </div>
          </div>
        </ThemeProvider>

        <div className="top-layer pointer-events-none fixed left-0 top-0 z-50 h-screen w-screen" />
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
