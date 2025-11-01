import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#e7e5e4',
};

export const metadata: Metadata = {
  title: 'Marijana Pavlinić / Digital Stamp Collection',
  description:
    "Paying homage to my grandpa's lifelong passion for philately, by recreating his stamps in a digital form, exploring the blend of art, history, and typography and bringing it online for a new audience to enjoy.",
};

export default function StampsLayout({ children }: { children: React.ReactNode }) {
  return <div className="stamps-layout">{children}</div>;
}
