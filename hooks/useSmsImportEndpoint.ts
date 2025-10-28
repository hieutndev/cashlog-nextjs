'use client';
import { useFetch } from "hieutndev-toolkit";

import { IAPIResponse } from "@/types/global";
import { TParseSMSResult } from "@/app/api/_services/sms-parser";
import { TBankCode } from "@/types/bank";

export interface ParseSMSRequest {
  smsText: string;
  bankCode: TBankCode;
  cardId?: number;
}

export function useSmsImportEndpoint() {
  const useParseSMS = (body: ParseSMSRequest) =>
    useFetch<IAPIResponse<TParseSMSResult>>("/transactions/parse-sms", {
      method: "POST",
      body,
      skip: true,
    });

  return { useParseSMS };
}

