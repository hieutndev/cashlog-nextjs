'use client';

import { useState, useEffect } from 'react';
import { useFetch } from 'hieutndev-toolkit';

import {
  RecurringInstance,
  TRecurringInstanceFilters,
} from '@/types/recurring';
import { IAPIResponse } from '@/types/global';

interface UseRecurringInstancesReturn {
  instances: RecurringInstance[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  mutate: (data: RecurringInstance[]) => void;
}

/**
 * Build query string from filters
 */
function buildQueryString(params: TRecurringInstanceFilters): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : '';
}

export function useRecurringInstances(filters?: TRecurringInstanceFilters): UseRecurringInstancesReturn {
  const [instances, setInstances] = useState<RecurringInstance[]>([]);
  const queryString = filters ? buildQueryString(filters) : '';

  const {
    data: fetchResult,
    loading,
    error: fetchError,
    fetch: refetch,
  } = useFetch<IAPIResponse<RecurringInstance[]>>(`/recurrings/recurring-instances${queryString}`);

  useEffect(() => {
    if (fetchResult?.results) {
      setInstances(fetchResult.results || []);
    }
  }, [fetchResult]);

  const mutate = (data: RecurringInstance[]) => {
    setInstances(data);
  };

  return {
    instances,
    loading,
    error: fetchError ? (typeof fetchError === 'string' ? fetchError : JSON.parse(fetchError).message) : null,
    refetch,
    mutate,
  };
}
