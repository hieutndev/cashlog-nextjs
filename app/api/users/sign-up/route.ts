import { NextResponse } from "next/server";

import { createNewUser, signUpSchema } from "../user-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";

import { validateRequest } from "@/utils/ajv";

export const POST = async (request: Request) => {
    try {
        const requestBody = await request.json();



        const { isValid, errors } = validateRequest(signUpSchema, requestBody);

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