import { handleError } from "../../_helpers/handle-error";
import { getFromHeaders } from "../../_helpers/get-from-headers";
import { getCategoryVolumeStats } from "../../_services/analytics-services";
import { TUser } from "@/types/user";

export const GET = async (request: Request) => {
    try {
        const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);
        const url = new URL(request.url);
        const timePeriod = url.searchParams.get('time_period') || 'month';
        const specificTime = url.searchParams.get('specific_time');

        // Validate time_period
        const validTimePeriods = ['day', 'week', 'month', 'year'];

        if (!validTimePeriods.includes(timePeriod)) {
            return Response.json({
                status: "error",
                message: "Invalid time_period. Must be one of: day, week, month, year",
            }, {
                status: 400
            });
        }

        const parsedSpecificTime = specificTime ? parseInt(specificTime) : null;

        const results = await getCategoryVolumeStats(userId, timePeriod, parsedSpecificTime);

        return Response.json({
            status: "success",
            message: "Category volume statistics retrieved successfully",
            results,
        }, {
            status: 200
        });

    }
    catch (error: unknown) {
        return handleError(error);
    }
}

