import { NextResponse } from "next/server";

import { getNewAccessToken } from "../../_services/user-services";
import { handleError } from "../../_helpers/handle-error";

import { ApiError } from "@/types/api-error";

export const GET = async (request: Request) => {
    try {

        // get x-rftk from request headers
        const xRftk = request.headers.get("x-rftk");

        if (!xRftk) {
            return handleError(new ApiError('x-rftk header is required', 403));
        }

        return NextResponse.json({
            status: "success",
            message: "New access token generated successfully",
            results: await getNewAccessToken(xRftk),
        })


    } catch (error: unknown) {
        return handleError(error);
    }
}