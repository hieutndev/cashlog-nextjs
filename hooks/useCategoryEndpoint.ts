'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TCategory } from "@/types/category";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useCategoryEndpoint() {
  const useGetCategories = () => 
    useFetch<IAPIResponse<TCategory[]>>(API_ENDPOINT.CATEGORIES.BASE, { method: 'GET' });
  
  const useDeleteCategory = (categoryId: number) => 
    useFetch<IAPIResponse>(`/categories/${categoryId}`, { method: 'DELETE', skip: true });
  
  return { useGetCategories, useDeleteCategory };
}
