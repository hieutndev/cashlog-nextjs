import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { createMultiCardsSchema, createMultipleCards } from "../card-services";

import { validateRequest } from "@/utils/ajv";

export const POST = async (request: Request) => {
	try {
		const userId = getFromHeaders<number>(request, "x-user-id", -1);

		const requestBody = await request.json();

		const { isValid, errors } = validateRequest(createMultiCardsSchema, requestBody);

		if (!isValid) {
			return handleValidateError(errors);
		}

		return Response.json({
			status: "success",
			message: "Create multiple cards successfully",
			results: await createMultipleCards(requestBody.card_names, userId),
		});
	} catch (error: unknown) {
		return handleError(error);
	}
};
