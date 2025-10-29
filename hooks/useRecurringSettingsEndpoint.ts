'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TRecurringResponse } from "@/types/recurring";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useRecurringSettingsEndpoint() {
  const useGetRecurrings = () => 
    useFetch<IAPIResponse<TRecurringResponse[]>>(API_ENDPOINT.RECURRINGS.BASE, { method: 'GET' });
  
  const useDeleteRecurring = (recurringId: number, deleteInstances: boolean = false, keepCompletedTransactions: boolean = true) => {
    const url = `${API_ENDPOINT.RECURRINGS.BY_ID(recurringId)}?deleteInstances=${deleteInstances}&keepCompletedTransactions=${keepCompletedTransactions}`;

    return useFetch<IAPIResponse>(url, { method: 'DELETE', skip: true });
  };
  
  return { useGetRecurrings, useDeleteRecurring };
}
