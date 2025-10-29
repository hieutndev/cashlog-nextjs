'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TTransactionWithCardAndCategory } from "@/types/transaction";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  cardId?: string;
  transactionType?: "out" | "in" | "";
  sortBy?: string;
}

export function useTransactionEndpoint() {
  const useGetTransactions = (params?: TransactionQueryParams) => {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value.toString();
        }

        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';
    
    const url = queryString ? `${API_ENDPOINT.TRANSACTIONS.BASE}?${queryString}` : API_ENDPOINT.TRANSACTIONS.BASE;
    
    return useFetch<IAPIResponse<TTransactionWithCardAndCategory[]>>(url, { method: 'GET' });
  };
  
  const useCreateTransaction = () => 
    useFetch<IAPIResponse>(API_ENDPOINT.TRANSACTIONS.BASE, { method: 'POST', skip: true });
  
  const useUpdateTransaction = (transactionId: number) => 
    useFetch<IAPIResponse>(`${API_ENDPOINT.TRANSACTIONS.BASE}/${transactionId}`, { method: 'PUT', skip: true });
  
  const useDeleteTransaction = (transactionId: number) => 
    useFetch<IAPIResponse>(`${API_ENDPOINT.TRANSACTIONS.BASE}/${transactionId}`, { method: 'DELETE', skip: true });
  
  return { useGetTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction };
}
