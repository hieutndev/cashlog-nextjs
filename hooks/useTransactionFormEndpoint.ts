'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TAddTransaction } from "@/types/transaction";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useTransactionFormEndpoint() {
  const useCreateTransaction = (body: TAddTransaction) => 
    useFetch<IAPIResponse>(API_ENDPOINT.TRANSACTIONS.BASE, { 
      method: 'POST', 
      body, 
      skip: true 
    });
  
  const useUpdateTransaction = (transactionId: string, body: TAddTransaction) => 
    useFetch<IAPIResponse>(API_ENDPOINT.TRANSACTIONS.BY_ID(transactionId), { 
      method: 'PUT', 
      body, 
      skip: true 
    });
  
  return { useCreateTransaction, useUpdateTransaction };
}
