'use client';

import { useState, useEffect } from 'react';
import { useFetch } from 'hieutndev-toolkit';

import { TRecurringResponse } from '@/types/recurring';
import { IAPIResponse } from '@/types/global';

interface UseRecurringReturn {
  recurring: TRecurringResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  mutate: (data: TRecurringResponse | null) => void;
}

export function useRecurring(id: string): UseRecurringReturn {
  const [recurring, setRecurring] = useState<TRecurringResponse | null>(null);

  const {
    data: fetchResult,
    loading,
    error: fetchError,
    fetch: refetch,
  } = useFetch<IAPIResponse<TRecurringResponse & { upcoming_instances?: any[] }>>(`/recurrings/${id}`, {
    skip: !id,
  });

  useEffect(() => {
    if (fetchResult?.results) {
      setRecurring(fetchResult.results || null);
    }
  }, [fetchResult]);

  const mutate = (data: TRecurringResponse | null) => {
    setRecurring(data);
  };

  return {
    recurring,
    loading,
    error: fetchError ? (typeof fetchError === 'string' ? fetchError : JSON.parse(fetchError).message) : null,
    refetch,
    mutate,
  };
}
