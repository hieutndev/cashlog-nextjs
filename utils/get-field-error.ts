import { ErrorObject } from "ajv";

export const getFieldError = (
  validateErrors: ErrorObject[],
  fieldName: string
) => {
  return validateErrors.find((error) => error.instancePath === `/${fieldName}`);
};
