import { readXlsxFile } from "../../_services/transaction-services";

import { handleError } from './../../_helpers/handle-error';

import { ApiError } from "@/types/api-error";

export const POST = async (request: Request) => {
	try {
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return handleError(new ApiError("No file uploaded", 400));
		}

		const results = await readXlsxFile(file);

		return Response.json({
			status: "success",
			results,
		});
	} catch (error: unknown) {
		console.error("Error processing Excel file:", error);

		return handleError(error);
	}
};
