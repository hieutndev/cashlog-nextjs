import { NextResponse } from "next/server";

import { signIn, signInSchema } from "../../_services/user-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";

import { zodValidate } from "@/utils/zod-validate";

export const POST = async (request: Request) => {
    try {

        const requestBody = await request.json();

        const { is_valid, errors } = zodValidate(signInSchema, requestBody);

        if (!is_valid) {
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