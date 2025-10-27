'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TAddNewCard, TCard, TUpdateCard } from "@/types/card";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useCardEndpoint() {
  const useGetListCards = () =>
    useFetch<IAPIResponse<TCard[]>>(API_ENDPOINT.CARDS.BASE, { method: 'GET' });

  const useAddNewCard = (body: TAddNewCard) =>
    useFetch<IAPIResponse>(API_ENDPOINT.CARDS.CREATE_NEW_CARD, {
      method: "POST",
      body: body,
      headers: {
        "Content-Type": "application/json",
      },
      skip: true,
    })

  const useUpdateCard = (cardId: string | number, body: TUpdateCard) =>
    useFetch<IAPIResponse>(`${API_ENDPOINT.CARDS.BASE}/${cardId}`, {
      method: "PUT",
      body: body,
      headers: {
        "Content-Type": "application/json",
      },
      skip: true,
    })

  const useDeleteCard = (cardId: number) =>
    useFetch<IAPIResponse>(`${API_ENDPOINT.CARDS.BASE}/${cardId}`, { method: 'DELETE', skip: true });

  const useSyncCardBalance = () =>
    useFetch<IAPIResponse>(`${API_ENDPOINT.CARDS.BASE}/sync`, { method: 'GET', skip: true });

  return { useGetListCards, useDeleteCard, useSyncCardBalance, useAddNewCard, useUpdateCard };
}
