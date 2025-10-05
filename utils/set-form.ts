import { Dispatch, SetStateAction } from "react";

import { ZodCustomError } from "@/types/zod";
import { getFieldError } from "@/utils/get-field-error";

export const setForm = <I>(
  key: keyof I,
  value: I[keyof I],
  validateErrors: ZodCustomError[],
  setValidateErrors: Dispatch<SetStateAction<ZodCustomError[]>>,
  setState: Dispatch<SetStateAction<I>>
) => {
  if (getFieldError(validateErrors, key as string)) {
    setValidateErrors((prev) =>
      prev.filter((error) => error.instancePath !== `${key as string}`)
    );
  }

  setState((prev) => ({
    ...prev,
    [key]: value
  }));
};
