import { NextResponse } from "next/server";

import { signIn, signInSchema } from "../user-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";

import { validateRequest } from "@/utils/ajv";

export const POST = async (request: Request) => {
    try {

        const requestBody = await request.json();



        const { isValid, errors } = validateRequest(signInSchema, requestBody);

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