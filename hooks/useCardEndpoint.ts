'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TCard } from "@/types/card";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useCardEndpoint() {
  const useGetListCards = () => 
    useFetch<IAPIResponse<TCard[]>>(API_ENDPOINT.CARDS.BASE, { method: 'GET' });
  
  const useDeleteCard = (cardId: number) => 
    useFetch<IAPIResponse>(`${API_ENDPOINT.CARDS.BASE}/${cardId}`, { method: 'DELETE', skip: true });
  
  const useSyncCardBalance = () => 
    useFetch<IAPIResponse>(`${API_ENDPOINT.CARDS.BASE}/sync`, { method: 'GET', skip: true });
  
  return { useGetListCards, useDeleteCard, useSyncCardBalance };
}
