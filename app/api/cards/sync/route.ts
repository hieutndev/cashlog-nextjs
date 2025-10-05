import { getFromHeaders } from "../../_helpers/get-from-headers";
import { handleError } from "../../_helpers/handle-error";
import { syncAllCardsBalance } from "../card-services";

import { TUser } from "@/types/user";

export const GET = async (request: Request) => {
	try {
		const userId = getFromHeaders<TUser["user_id"]>(request, "x-user-id", 0);

		await syncAllCardsBalance(userId);

		return Response.json({
			status: "success",
			message: "Sync card balance successfully",
		});
	} catch (error: unknown) {
		return handleError(error);
	}
};
