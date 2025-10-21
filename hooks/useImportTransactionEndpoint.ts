'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TImportFileXLSXResponse, TAddMultipleTransactionsResponse, TValidateCategoriesResponse, TValidateCardsResponse } from "@/types/transaction";

export function useImportTransactionEndpoint() {
  const useUploadXLSXFile = () => 
    useFetch<IAPIResponse<TImportFileXLSXResponse>>('/transactions/read-xlsx-file', { 
      method: 'POST', 
      skip: true 
    });
  
  const useCreateMultipleTransactions = () => 
    useFetch<IAPIResponse<TAddMultipleTransactionsResponse>>('/transactions/creates', { 
      method: 'POST', 
      skip: true 
    });
  
  const useValidateCategories = () => 
    useFetch<IAPIResponse<TValidateCategoriesResponse>>('/categories/categorize', { 
      method: 'POST', 
      skip: true 
    });
  
  const useValidateCards = () => 
    useFetch<IAPIResponse<TValidateCardsResponse>>('/cards/validate', { 
      method: 'POST', 
      skip: true 
    });
  
  const useInitCards = () => 
    useFetch<IAPIResponse>('/cards/creates', { 
      method: 'POST', 
      skip: true 
    });
  
  const useInitCategories = () => 
    useFetch<IAPIResponse>('/categories/creates', { 
      method: 'POST', 
      skip: true 
    });
  
  return { 
    useUploadXLSXFile, 
    useCreateMultipleTransactions, 
    useValidateCategories, 
    useValidateCards, 
    useInitCards, 
    useInitCategories 
  };
}
