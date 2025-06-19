import { ErrorObject } from "ajv";
import { Dispatch, SetStateAction } from "react";

import { getFieldError } from "@/utils/get-field-error";

export const setForm = <I>(
  key: keyof I,
  value: I[keyof I],
  validateErrors: ErrorObject[],
  setValidateErrors: Dispatch<SetStateAction<ErrorObject[]>>,
  setState: Dispatch<SetStateAction<I>>
) => {
  if (getFieldError(validateErrors, key as string)) {
    setValidateErrors((prev) =>
      prev.filter((error) => error.instancePath !== `/${key as string}`)
    );
  }

  setState((prev) => ({
    ...prev,
    [key]: value
  }));
};
