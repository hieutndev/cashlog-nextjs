'use client';

import {useState, useEffect} from 'react';
import {useFetch} from 'hieutndev-toolkit';

import {
    TRecurringResponse,
    TRecurringFilters,
} from '@/types/recurring';
import {IAPIResponse} from '@/types/global';

interface UseRecurringsReturn {
    recurrings: TRecurringResponse[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    mutate: (data: TRecurringResponse[]) => void;
}

/**
 * Build query string from filters
 */
function buildQueryString(params: TRecurringFilters): string {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            query.append(key, String(value));
        }
    });

    const queryString = query.toString();

    return queryString ? `?${queryString}` : '';
}

export function useRecurrings(filters?: TRecurringFilters): UseRecurringsReturn {
    const [recurrings, setRecurrings] = useState<TRecurringResponse[]>([]);
    const queryString = filters ? buildQueryString(filters) : '';

    const {
        data: fetchResult,
        loading,
        error: fetchError,
        fetch: refetch,
    } = useFetch<IAPIResponse<TRecurringResponse[]>>(`/recurrings${queryString}`);

    useEffect(() => {
        if (fetchResult?.results) {
            setRecurrings(fetchResult.results || []);
        }
    }, [fetchResult]);

    const mutate = (data: TRecurringResponse[]) => {
        setRecurrings(data);
    };

    return {
        recurrings,
        loading,
        error: fetchError ? (typeof fetchError === 'string' ? fetchError : JSON.parse(fetchError).message) : null,
        refetch,
        mutate,
    };
}
