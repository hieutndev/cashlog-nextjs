'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TRecurringInstancesResponse } from "@/types/recurring";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export interface RecurringInstancesParams {
  card_id?: number | null;
}

export function useRecurringEndpoint() {
  const useGetRecurringInstances = (params?: RecurringInstancesParams) => {
    const queryString = params?.card_id ? `?card_id=${params.card_id}` : '';
    const url = `${API_ENDPOINT.RECURRINGS.INSTANCES}${queryString}`;
    
    return useFetch<IAPIResponse<TRecurringInstancesResponse>>(url, { method: 'GET' });
  };
  
  const useSkipInstance = (instanceId: number) => 
    useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.INSTANCE_SKIP(instanceId), { method: 'POST', skip: true });
  
  const useCreateTransactionFromInstance = (instanceId: number) => 
    useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.INSTANCE_CREATE_TRANSACTION(instanceId), { method: 'POST', skip: true });
  
  return { useGetRecurringInstances, useSkipInstance, useCreateTransactionFromInstance };
}
