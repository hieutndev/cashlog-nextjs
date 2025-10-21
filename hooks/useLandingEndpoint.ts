'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useLandingEndpoint() {
  const useGetStatistics = () => 
    useFetch<IAPIResponse<{
      total_users: number;
      total_transactions: number;
      total_cards: number;
    }>>(API_ENDPOINT.LANDING_PAGE.BASE, { 
      method: 'GET' 
    });
  
  return { useGetStatistics };
}
