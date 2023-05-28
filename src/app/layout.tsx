import '../../tokens/style/global.css';
import '../../tokens/style/theme-blue-dark.css';
import '../../tokens/style/theme-blue-light.css';
import '../../tokens/style/theme-blue.css';
import '../../tokens/style/theme-dark.css';
import '../../tokens/style/theme-green-dark.css';
import '../../tokens/style/theme-green-light.css';
import '../../tokens/style/theme-light.css';
import '../../tokens/style/theme-red-dark.css';
import '../../tokens/style/theme-red-light.css';
import './globals.css';
import Footer from '~/src/app/components/Footer';
import { ThemeProvider } from '~/src/app/ThemeProvider';
import { Archivo, Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300'],
  variable: '--font-archivo',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <title>Marijana Šimag&apos;s Personal website</title>
      <head></head>
      <body className={`${inter.variable} ${archivo.variable} font-sans`}>
        <ThemeProvider>
          <div className="main bg-main-background">
            <div className="max-w-screen-2xl m-auto min-h-screen flex flex-col">
              {children}
              <Footer />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
