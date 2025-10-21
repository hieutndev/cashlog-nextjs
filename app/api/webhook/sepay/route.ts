import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError } from "../../_helpers/handle-error"

import { ApiError } from "@/types/api-error";

export const POST = async (request: Request) => {
    try {

        const api_key = getFromHeaders(request, "api_key", null);

        if (!api_key) {
            return handleError(new ApiError("API key is required", 400));
        }

    } catch (error: unknown) {
        return handleError(error);
    }
}