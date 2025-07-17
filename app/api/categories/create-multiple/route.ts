import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { createMultiCategoriesSchema, createMultipleCategories } from "../categories-services";

import { validateRequest } from "@/utils/ajv";

export const POST = async (request: Request) => {
	try {
		const userId = getFromHeaders<number>(request, "x-user-id", 0);

		const requestBody = await request.json();

		const { isValid, errors } = validateRequest(createMultiCategoriesSchema, requestBody);

		if (!isValid) {
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
