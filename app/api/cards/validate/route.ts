import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError } from "../../_helpers/handle-error"
import { validateCards } from "../../_services/card-services";

import { ApiError } from "@/types/api-error";

export const POST = async (request: Request) => {
    try {

        const userId = getFromHeaders<number>(request, 'x-user-id', 0);

        const requestBody = await request.json();

        if (!requestBody.card_names) {
            return handleError(new ApiError('Missing `card_names` fields', 404));
        }

        return Response.json({
            status: 'success',
            results: await validateCards(requestBody.card_names, userId)
        })

    } catch (error: unknown) {
        return handleError(error)
    }
}