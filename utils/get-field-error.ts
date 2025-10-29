import { ZodCustomError } from "@/types/zod";

export const getFieldError = (
  validateErrors: ZodCustomError[],
  fieldName: string
) => {
  console.log(validateErrors.find((error) => error.instancePath === `${fieldName}`))

  return validateErrors.find((error) => error.instancePath === `${fieldName}`);
};
