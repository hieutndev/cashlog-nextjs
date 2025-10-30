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

  const useCreateBulkCategories = () =>
    useFetch<IAPIResponse>('/categories/creates', {
      method: 'POST',
      skip: true
    });

  return { useCreateCategory, useUpdateCategory, useCreateBulkCategories };
}
