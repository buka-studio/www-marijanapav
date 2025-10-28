'use client';

import { ReactNode, useEffect, useState } from 'react';

export default function ClientRendered({ children }: { children?: ReactNode | undefined }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return children as any;
}
