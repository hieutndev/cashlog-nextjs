import { NextResponse } from "next/server";

import { createNewUser, signUpSchema } from "../user-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";

import { zodValidate } from "@/utils/zod-validate";

export const POST = async (request: Request) => {
    try {
        const requestBody = await request.json();

        const { is_valid, errors } = zodValidate(signUpSchema, requestBody);

        if (!is_valid) {
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