import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { createMultipleCategoriesPayload, createBulkCategoriesPayload, createMultipleCategories, createBulkCategories } from "../../_services/categories-services";

import { TUser } from "@/types/user";
import { zodValidate } from "@/utils/zod-validate";

export const POST = async (request: Request) => {
	try {
		const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

		const requestBody = await request.json();

		// Try new format (categories with colors) first
		let { is_valid, errors } = zodValidate(createBulkCategoriesPayload, requestBody);

		if (is_valid) {
			return Response.json({
				status: "success",
				message: "Created multiple categories successfully",
				results: await createBulkCategories(requestBody.categories, userId),
			});
		}

		// Fall back to old format (category_names only) for backward compatibility
		({ is_valid, errors } = zodValidate(createMultipleCategoriesPayload, requestBody));

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
