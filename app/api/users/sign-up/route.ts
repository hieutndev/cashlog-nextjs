import { JSONSchemaType } from "ajv";
import { NextResponse } from "next/server";

import { createNewUser } from "../user-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";

import { TSignUp } from "@/types/user";
import { validateRequest } from "@/utils/ajv";
import { REGEX } from "@/config/regex";

export const POST = async (request: Request) => {
    try {
        const requestBody = await request.json();

        const validateSchema: JSONSchemaType<TSignUp> = {
            type: "object",
            properties: {
                email: { type: "string", format: "email", minLength: 1 },
                password: { type: "string", minLength: 1, pattern: REGEX.PASSWORD },
                confirmPassword: { type: "string", minLength: 6 },
            },
            required: ["email", "password", "confirmPassword"],
            additionalProperties: false,
        };

        const { isValid, errors } = validateRequest(validateSchema, requestBody);

        if (!isValid) {
            return handleValidateError(errors);
        }



        return NextResponse.json({
            status: "success",
            message: "User registered successfully",
            results: await createNewUser(requestBody)
        })
    } catch (error: unknown) {
        return handleError(error);
    }
};