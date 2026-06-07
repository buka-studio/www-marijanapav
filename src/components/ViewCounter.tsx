'use client';

import { useEffect } from 'react';

import { useIncrementStatsMutation } from '~/src/lib/query/api';

interface ViewCounterProps {
  pathname: string;
  type?: string;
  amount?: number;
}

export function useViewLogger(pathname: string, type = 'view', amount = 1) {
  const { mutate } = useIncrementStatsMutation();

  useEffect(() => {
    if (!pathname) {
      return;
    }

    mutate({ pathname, type, amount });
  }, [amount, mutate, pathname, type]);
}

export default function ViewCounter({ pathname, type = 'view', amount = 1 }: ViewCounterProps) {
  useViewLogger(pathname, type, amount);

  return null;
}
