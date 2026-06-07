'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SitePulse } from '~/src/lib/sitePulse';

export const queryKeys = {
  sitePulse: ['site-pulse'] as const,
  stats: (pathname: string, type = 'view') => ['stats', pathname, type] as const,
};

type StatsResponse = {
  count: number;
};

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Request failed.';

    throw new Error(message);
  }

  return data as T;
}

async function fetchStats(pathname: string, type = 'view') {
  const params = new URLSearchParams([
    ['pathname', pathname],
    ['type', type],
  ]);

  const response = await fetch('/api/stats?' + params, {
    cache: 'no-store',
  });

  return parseJson<StatsResponse>(response);
}

async function incrementStats(pathname: string, type = 'view', amount = 1) {
  const params = new URLSearchParams([
    ['pathname', pathname],
    ['type', type],
  ]);

  const response = await fetch('/api/stats?' + params, {
    method: 'POST',
    body: JSON.stringify({ amount }),
  });

  return parseJson<StatsResponse>(response);
}

async function fetchSitePulse() {
  const response = await fetch('/api/site-pulse', {
    cache: 'no-store',
  });

  return parseJson<SitePulse>(response);
}

export function useStatsQuery(pathname: string, type = 'view', initialData?: StatsResponse) {
  return useQuery({
    queryKey: queryKeys.stats(pathname, type),
    queryFn: () => fetchStats(pathname, type),
    placeholderData: initialData,
  });
}

export function useIncrementStatsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pathname,
      type = 'view',
      amount = 1,
    }: {
      pathname: string;
      type?: string;
      amount?: number;
    }) => incrementStats(pathname, type, amount),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(queryKeys.stats(variables.pathname, variables.type ?? 'view'), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.sitePulse });
    },
  });
}

export function useSitePulseQuery(initialData?: SitePulse) {
  return useQuery({
    queryKey: queryKeys.sitePulse,
    queryFn: fetchSitePulse,
    initialData,
  });
}

export function useFeedbackMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        body: formData,
      });

      if (response.status === 204) {
        return {};
      }

      return parseJson<{ ok?: boolean; message?: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sitePulse });
    },
  });
}

export function useSketchUploadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/sketches', {
        method: 'POST',
        body: formData,
      });

      return parseJson<{ message: string }>(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sitePulse });
    },
  });
}
