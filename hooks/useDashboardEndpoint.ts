'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TDashboardData } from "@/types/dashboard";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export interface DashboardQueryParams {
  time_period: string;
  specific_time?: string;
}

export function useDashboardEndpoint() {
  const useGetDashboardData = (params: DashboardQueryParams) => {
    const queryParams = new URLSearchParams();

    queryParams.set('time_period', params.time_period);
    
    if (params.specific_time) {
      queryParams.set('specific_time', params.specific_time);
    }
    
    const url = `${API_ENDPOINT.DASHBOARD.BASE}?${queryParams.toString()}`;
    
    return useFetch<IAPIResponse<TDashboardData>>(url, { method: 'GET' });
  };
  
  return { useGetDashboardData };
}
