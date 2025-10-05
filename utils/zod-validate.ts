import { ZodError, ZodType } from "zod";

import { ZodCustomError } from "@/types/zod";

const parseError = (errors: ZodError | null | undefined): ZodCustomError[] | null => {
  
  if (!errors) return null;

  return errors?.issues.map((e) => {

    return {
      ...e,
      instancePath: e.path.join("."),
    };
  });
};

export const zodValidate = <T>(schema: ZodType<T>, data: any) => {
  try {
    schema.parse(data);

    return { is_valid: true, errors: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { is_valid: false, errors: parseError(error) };
    }
    throw error;
  }
};

export { parseError };