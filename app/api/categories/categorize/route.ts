import { handleError, handleValidateError } from "../../_helpers/handle-error"
import { categorizeCategoriesPayload, categorizeUserCategories } from "../categories-services";
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { TUser } from "@/types/user";
import { zodValidate } from "@/utils/zod-validate";

export const POST = async (request: Request) => {
    try {

        const userId = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0)

        const requestBody = await request.json();

        const { is_valid, errors } = zodValidate(categorizeCategoriesPayload, requestBody);

        if (!is_valid) {
            return handleValidateError(errors);
        }

        return Response.json({
            status: 'success',
            results: await categorizeUserCategories(requestBody.category_names, userId)
        });
    } catch (error: unknown) {
        return handleError(error);
    }
}