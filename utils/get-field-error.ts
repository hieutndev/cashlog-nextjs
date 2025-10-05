import { ZodCustomError } from "@/types/zod";

export const getFieldError = (
  validateErrors: ZodCustomError[],
  fieldName: string
) => {
  return validateErrors.find((error) => error.instancePath === `${fieldName}`);
};
