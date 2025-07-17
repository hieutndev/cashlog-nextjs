import { handleError } from "../../_helpers/handle-error";
import { processFile } from "../transaction-services";

export const POST = async (request: Request) => {
	try {
		// Get form data from request
		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return Response.json(
				{
					status: "error",
					message: "No file provided",
				},
				{ status: 400 }
			);
		}

		const results = await processFile(file);

		return Response.json({
			status: "success",
			results,
		});
	} catch (error: unknown) {
		console.error("Error processing Excel file:", error);

		return handleError(error);
	}
};
