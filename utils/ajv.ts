import Ajv, { ErrorObject, JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

import { upperFirstLetter } from "@/utils/text-transform";

const ajv = new Ajv({ strict: false }); // reusable instance

addFormats(ajv);

const parseError = (
  errors:
    | ErrorObject<string, Record<string, any>, unknown>[]
    | null
    | undefined
): ErrorObject[] => {
  const mapErrors = errors?.map((error) => {
    if (error.keyword === "enum") {
      error.message = `${error.message}: [${error.params.allowedValues.join(", ")}]`;
    }

    return {
      ...error,
      message: upperFirstLetter(error.message ?? "")
    };
  });

  return mapErrors as ErrorObject[];
};

export const validateRequest = <T>(
  validateSchema: JSONSchemaType<T>,
  validateData: any
) => {
  const validate = ajv.compile(validateSchema);
  const isValid = validate(validateData);

  return {
    isValid,
    errors: parseError(validate.errors) || null
  };
};
