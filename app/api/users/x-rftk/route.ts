import { NextResponse } from "next/server";

import { getNewAccessToken } from "../../_services/user-services";
import { handleError } from "../../_helpers/handle-error";

import { ApiError } from "@/types/api-error";

export const GET = async (request: Request) => {
    try {

        // get x-rftk from request headers
        const x_rftk = request.headers.get("x-rftk");

        if (!x_rftk) {
            return handleError(new ApiError('x-rftk header is required', 403));
        }

        return NextResponse.json({
            status: "success",
            message: "New access token generated successfully",
            results: {
                access_token: await getNewAccessToken(x_rftk)
            },
        })


    } catch (error: unknown) {
        return handleError(error);
    }
}