import { JSONSchemaType } from "ajv";
import { NextResponse } from "next/server";

import { signIn } from "../user-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";

import { TSignIn } from "@/types/user";
import { validateRequest } from "@/utils/ajv";

export const POST = async (request: Request) => {
    try {

        const requestBody = await request.json();

        const validateSchema: JSONSchemaType<TSignIn> = {
            type: "object",
            properties: {
                email: { type: "string", format: "email", minLength: 1 },
                password: { type: "string", minLength: 1 },
            },
            required: ["email", "password"],
            additionalProperties: false,
        };

        const { isValid, errors } = validateRequest(validateSchema, requestBody);

        if (!isValid) {
            return handleValidateError(errors);
        }

        return NextResponse.json({
            status: "success",
            message: "User signed in successfully",
            results: await signIn(requestBody)
        });
    } catch (error: unknown) {
        return handleError(error);
    }
};