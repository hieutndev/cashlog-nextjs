import { handleError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { calculateAnalytics } from "./analytics-services";

export const GET = async (request: Request) => {
    try {
        const userId = getFromHeaders(request, "x-user-id", '');

        const results = await calculateAnalytics(userId);

        return Response.json({
            status: "success",
            message: "Analytics data retrieved successfully",
            results,
        }, {
            status: 200
        })

    }
    catch (error: unknown) {
        return handleError(error);
    }
}