import { handleError } from "../_helpers/handle-error";
import { extractBillInfo } from "../_services/extract-bill-services";

export const POST = async (request: Request) => {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        const result = await extractBillInfo(file);

        return Response.json({
            status: "success",
            results: result,
        });
    } catch (error: unknown) {
        return handleError(error);
    }

}