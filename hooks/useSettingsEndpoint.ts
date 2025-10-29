'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";

export function useSettingsEndpoint() {
  const useResetAccountData = () => 
    useFetch<IAPIResponse>("/settings/reset", { method: 'POST', skip: true });
  
  return { useResetAccountData };
}
