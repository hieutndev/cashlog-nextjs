import { handleError } from "../_helpers/handle-error";

import { ApiError } from "@/types/api-error";

const HIEUTNDEVCOM_SERVER_API_URL = process.env.HIEUTNDEVCOM_SERVER_API_URL;

export const extractBillInfo = async (file: File) => {
    try {
        const form = new FormData();

        form.append('file', file);

        const response = await fetch(`${HIEUTNDEVCOM_SERVER_API_URL}/extract-text/bill`, {
            method: 'POST',
            body: form,
        });

        if (!response.ok) {
            return handleError(new ApiError('Failed to extract bill info', response.status));
        }

        const result = await response.json();

        console.log("🚀 ~ extractBillInfo ~ result:", result)

        return result;
    } catch (error) {
        console.error("Error in extractBillInfo:", error);
        throw error;
    }
}