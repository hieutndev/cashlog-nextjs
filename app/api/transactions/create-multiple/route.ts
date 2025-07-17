import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { validateNewMultipleTransactionSchema, createMultipleTransaction } from "../transaction-services";

import { validateRequest } from "@/utils/ajv";

export const POST = async (request: Request) => {
	try {
		const userId = getFromHeaders<number>(request, "x-user-id", 0);

		const requestBody = await request.json();

		const { isValid, errors } = validateRequest(validateNewMultipleTransactionSchema, requestBody);

		if (!isValid) {
			return handleValidateError(errors);
		}

		const createMultipleResult = await createMultipleTransaction(requestBody.list_transactions, userId);

		return Response.json(
			{
				status: "success",
				message: `Created ${createMultipleResult.success_count} transactions successfully`,
				results: createMultipleResult,
			},
			{ status: 201 }
		);
	} catch (error: unknown) {
		return handleError(error);
	}
};
