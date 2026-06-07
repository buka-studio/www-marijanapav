'use client';

import type { ReactNode } from 'react';

import QueryProvider from '~/src/lib/query/QueryProvider';

export function Providers({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}

export default Providers;
