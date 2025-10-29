'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";

export function useCategoryFormEndpoint() {
  const useCreateCategory = () => 
    useFetch<IAPIResponse>('/categories', { 
      method: 'POST', 
      skip: true 
    });
  
  const useUpdateCategory = (categoryId: number) => 
    useFetch<IAPIResponse>(`/categories/${categoryId}`, { 
      method: 'PUT', 
      skip: true 
    });
  
  return { useCreateCategory, useUpdateCategory };
}
