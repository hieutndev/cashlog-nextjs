import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { createMultipleCategoriesPayload, createMultipleCategories } from "../categories-services";

import { TUser } from "@/types/user";
import { zodValidate } from "@/utils/zod-validate";

export const POST = async (request: Request) => {
	try {
		const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

		const requestBody = await request.json();

		const { is_valid, errors } = zodValidate(createMultipleCategoriesPayload, requestBody);

		if (!is_valid) {
			return handleValidateError(errors);
		}

		return Response.json({
			status: "success",
			message: "Created multiple categories successfully",
			results: await createMultipleCategories(requestBody.category_names, userId),
		});
	} catch (error: unknown) {
		return handleError(error);
	}
};
