import { Metadata } from 'next';

import ColorTokenPlayground from './ColorTokenPlayground';

export const metadata: Metadata = {
  title: 'Color tokens — playground',
  robots: { index: false, follow: false },
};

export default function PlaygroundColorsPage() {
  return <ColorTokenPlayground />;
}
