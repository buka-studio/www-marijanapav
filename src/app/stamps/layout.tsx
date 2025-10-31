import { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  themeColor: '#e7e5e4',
};

export const metadata: Metadata = {
  title: 'Marijana Pavlinić | Stamp Collection',
  description: "Marijana Pavlinić's stamp collection",
};

export default function StampsLayout({ children }: { children: React.ReactNode }) {
  return <div className="stamps-layout">{children}</div>;
}
