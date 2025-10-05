import { handleError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { calculateAnalytics } from "./analytics-services";

import { ApiError } from "@/types/api-error";
import { TUser } from "@/types/user";

const EST_YEAR = process.env.NEXT_PUBLIC_EST_YEAR ? parseInt(process.env.NEXT_PUBLIC_EST_YEAR) : 2025;

export const GET = async (request: Request) => {
    try {
        const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);
        const url = new URL(request.url);
        const timePeriod = url.searchParams.get('time_period') || 'month';
        const specificTime = url.searchParams.get('specific_time');

        // Validate time_period
        const validTimePeriods = ['day', 'week', 'month', 'year'];

        if (!validTimePeriods.includes(timePeriod)) {
            return handleError(new ApiError("Invalid time_period. Must be one of: day, week, month, year", 400));
        }

        // Validate specific_time based on time_period
        let parsedSpecificTime = null;

        if (specificTime !== null && (timePeriod === 'month' || timePeriod === 'year')) {
            parsedSpecificTime = parseInt(specificTime);
            if (isNaN(parsedSpecificTime)) {
                return handleError(new ApiError("Invalid specific_time. Must be a valid number for month/year periods", 400));
            }

            // Validate month range (1-12)
            if (timePeriod === 'month' && (parsedSpecificTime < 1 || parsedSpecificTime > 12)) {
                return handleError(new ApiError("Invalid specific_time for month. Must be between 1-12", 400));
            }

            // Validate year range (reasonable range)
            if (timePeriod === 'year' && (parsedSpecificTime < EST_YEAR || parsedSpecificTime > new Date().getFullYear() + 1)) {
                return handleError(new ApiError(`Invalid specific_time for year. Must be between ${EST_YEAR}-${new Date().getFullYear() + 1}`, 400));
            }
        }

        const results = await calculateAnalytics(userId, timePeriod, parsedSpecificTime);

        return Response.json({
            status: "success",
            message: "Analytics data retrieved successfully",
            results,
        }, {
            status: 200
        })

    }
    catch (error: unknown) {
        return handleError(error);
    }
}