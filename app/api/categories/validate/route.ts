import { handleError } from "../../_helpers/handle-error"
import { validateCategories } from "../categories-services";
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { ApiError } from "@/types/api-error";

export const POST = async (request: Request) => {
    try {

        const userId = getFromHeaders<number>(request, 'x-user-id', -1)

        const requestBody = await request.json();

        if (!requestBody.category_names) {
            return handleError(new ApiError('Missing `category_names` fields', 404));
        }

        return Response.json({
            status: 'success',
            results: await validateCategories(requestBody.category_names, userId)
        })


    } catch (error: unknown) {
        return handleError(error);
    }
}