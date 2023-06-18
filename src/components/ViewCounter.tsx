'use client';

import { useEffect } from 'react';

export default function ViewLogger({ pathname }: { pathname: string }) {
  useEffect(() => {
    const params = new URLSearchParams([
      ['pathname', pathname],
      ['type', 'view'],
    ]).toString();

    fetch('/api/stats?' + params, {
      method: 'POST',
    });
  }, [pathname]);

  return null;
}
