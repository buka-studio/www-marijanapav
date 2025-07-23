import { Suspense } from 'react';

import Header from './components/Header';

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      {children}
    </>
  );
}
