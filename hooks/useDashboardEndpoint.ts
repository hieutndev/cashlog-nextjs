'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TDashboardData } from "@/types/dashboard";
import { API_ENDPOINT } from "@/configs/api-endpoint";
import { TTotalAsset, TCategoryVolume } from "@/types/analytics";

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

  const useGetTotalAssetFluctuation = (params: DashboardQueryParams) => {
    const queryParams = new URLSearchParams();

    queryParams.set('time_period', params.time_period);

    if (params.specific_time) {
      queryParams.set('specific_time', params.specific_time);
    }

    const url = `${API_ENDPOINT.ANALYTICS.TOTAL_ASSET}?${queryParams.toString()}`;

    return useFetch<IAPIResponse<TTotalAsset[]>>(url, { method: 'GET' });
  };

  const useGetCategoryVolume = (params: DashboardQueryParams) => {
    const queryParams = new URLSearchParams();

    queryParams.set('time_period', params.time_period);

    if (params.specific_time) {
      queryParams.set('specific_time', params.specific_time);
    }

    const url = `${API_ENDPOINT.ANALYTICS.CATEGORY_VOLUME}?${queryParams.toString()}`;

    return useFetch<IAPIResponse<TCategoryVolume[]>>(url, { method: 'GET' });
  };

  return { useGetDashboardData, useGetTotalAssetFluctuation, useGetCategoryVolume };
}
