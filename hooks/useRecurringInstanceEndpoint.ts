'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TRecurringInstance } from "@/types/recurring";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useRecurringInstanceEndpoint() {
  const useGetInstanceById = (instanceId: number) => 
    useFetch<IAPIResponse<TRecurringInstance>>(API_ENDPOINT.RECURRINGS.INSTANCES_BY_ID(instanceId.toString()), { 
      skip: true 
    });
  
  return { useGetInstanceById };
}
