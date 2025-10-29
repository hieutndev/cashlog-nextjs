'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TSignIn, TSignInResponse, TSignUp } from "@/types/user";
import { API_ENDPOINT } from "@/configs/api-endpoint";

export function useAuthEndpoint() {
  const useSignIn = (body: TSignIn) => 
    useFetch<IAPIResponse<TSignInResponse>>(API_ENDPOINT.USERS.SIGN_IN, { 
      method: 'POST', 
      body, 
      skip: true 
    });
  
  const useSignUp = (body: TSignUp) => 
    useFetch<IAPIResponse>(API_ENDPOINT.USERS.SIGN_UP, { 
      method: 'POST', 
      body, 
      skip: true 
    });
  
  return { useSignIn, useSignUp };
}
