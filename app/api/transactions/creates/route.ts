import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { addMultipleTransactionsPayload, createMultipleTransaction } from "../transaction-services";

import { TUser } from "@/types/user";
import { zodValidate } from "@/utils/zod-validate";

export const POST = async (request: Request) => {
	try {
		const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

		const requestBody = await request.json();

		const { is_valid, errors } = zodValidate(addMultipleTransactionsPayload, requestBody);

		if (!is_valid) {
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
