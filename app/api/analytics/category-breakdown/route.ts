import { NextResponse } from "next/server";

import { handleError } from "../../_helpers/handle-error";
import { getFromHeaders } from "../../_helpers/get-from-headers";
import { getCategoryStatsByUserId } from "../analytics-services";

export async function GET(request: Request) {
    try {
        const userId = getFromHeaders<number>(request, "x-user-id", -1);

        if (userId === -1) {
            return NextResponse.json(
                {
                    status: "error",
                    message: "User ID is required",
                },
                { status: 400 }
            );
        }

        const categoryStats = await getCategoryStatsByUserId(userId);

        return NextResponse.json({
            status: "success",
            message: "Retrieved category statistics successfully",
            results: categoryStats,
        });
    } catch (error: unknown) {
        return handleError(error);
    }
}
