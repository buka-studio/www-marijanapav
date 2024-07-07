'use client';

import { useEffect } from 'react';

export function useViewLogger(pathname: string) {
  useEffect(() => {
    if (!pathname) return;
    const params = new URLSearchParams([
      ['pathname', pathname],
      ['type', 'view'],
    ]).toString();

    fetch('/api/stats?' + params, {
      method: 'POST',
    });
  }, [pathname]);
}

export default function ViewLogger({ pathname }: { pathname: string }) {
  useViewLogger(pathname);

  return null;
}
