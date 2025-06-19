import { JSONSchemaType } from "ajv";
import { NextResponse } from "next/server";

import { createNewUser } from "../user-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";

import { TSignUp } from "@/types/user";
import { validateRequest } from "@/utils/ajv";

export const POST = async (request: Request) => {
    try {
        const requestBody = await request.json();

        const validateSchema: JSONSchemaType<TSignUp> = {
            type: "object",
            properties: {
                email: { type: "string", format: "email" },
                password: { type: "string", minLength: 8, pattern: "^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$" },
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