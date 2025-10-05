import { NextRequest } from "next/server";

import { getFromHeaders } from "@/app/api/_helpers/get-from-headers";
import { resetUserData } from "@/app/api/settings/settings-services";
import { handleError } from "@/app/api/_helpers/handle-error";
import { TUser } from "@/types/user";

export const POST = async (request: NextRequest) => {
    try {
        const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

        await resetUserData(userId);

        return Response.json({
            status: "success",
            message: "Account data has been successfully reset",
        });
    } catch (error: unknown) {
        return handleError(error);
    }
};
