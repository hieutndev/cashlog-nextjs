'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TRecurringForm } from "@/types/recurring";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useRecurringFormEndpoint() {
  const useCreateRecurring = (body: TRecurringForm) => 
    useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.BASE, { 
      method: 'POST', 
      body, 
      skip: true 
    });
  
  const useUpdateRecurring = (recurringId: string, body: TRecurringForm) => 
    useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.BY_ID(recurringId), { 
      method: 'PUT', 
      body, 
      skip: true 
    });
  
  return { useCreateRecurring, useUpdateRecurring };
}
