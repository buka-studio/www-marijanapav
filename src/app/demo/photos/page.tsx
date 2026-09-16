import { Metadata } from 'next';

import DemoPhotos from './DemoPhotos';

export const metadata: Metadata = {
  title: 'Photos — demo',
  robots: { index: false, follow: false },
};

export default function DemoPhotosPage() {
  return <DemoPhotos />;
}
