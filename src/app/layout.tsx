import { Metadata } from 'next';
import { Archivo, Inter } from 'next/font/google';

import Footer from './components/Footer';
import { ThemeProvider } from './components/ThemeProvider';

import '~/tokens/style/global.css';
import '~/tokens/style/theme-blue-dark.css';
import '~/tokens/style/theme-blue-light.css';
import '~/tokens/style/theme-dark.css';
import '~/tokens/style/theme-green-dark.css';
import '~/tokens/style/theme-green-light.css';
import '~/tokens/style/theme-light.css';
import '~/tokens/style/theme-red-dark.css';
import '~/tokens/style/theme-red-light.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-archivo',
});

export const metadata: Metadata = {
  title: "Marijana Pavlinić's Personal Website",
  metadataBase:
    process.env.NODE_ENV === 'production' ? new URL('https://marijanasimag.com') : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="">
      <body className={`${inter.variable} ${archivo.variable} font-sans`}>
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
    </html>
  );
}
