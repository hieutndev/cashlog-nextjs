import { ErrorObject } from "ajv";

import { ApiError } from "@/types/api-error";

export const handleError = (error: unknown) => {

    let message = '';
    let statusCode = 500;

    if (error instanceof ApiError) {
        message = error.message;
        statusCode = error.statusCode;
    } else if (error instanceof Error) {
        message = error.message;
    } else {
        message = "An unknown error occurred";
    }

    return Response.json({
        status: "error",
        message: message
    }, {
        status: statusCode,
    });
}

export const handleValidateError = (errors: ErrorObject[]) => {
    return Response.json({
        status: "error",
        message: "Validation errors",
        validateErrors: errors
    }, {
        status: 400,
    });
}
