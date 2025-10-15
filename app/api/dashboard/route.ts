import { NextRequest, NextResponse } from "next/server";

import { handleError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";
import { calculateAnalytics, getCategoryStatsByUserId, getMonthlyAnalyticsData } from "../_services/analytics-services";
import { getAllCardsOfUser } from "../_services/card-services";
import { getAllTransactions } from "../_services/transaction-services";

import { getRecurringAnalysis, getRecurringInstancesWithBalances, updateOverdueInstances } from '@/app/api/_services/recurring-services';
import { TUser } from "@/types/user";
import { TRecurringInstanceFilters } from "@/types/recurring";
import { ApiError } from "@/types/api-error";

const EST_YEAR = process.env.NEXT_PUBLIC_EST_YEAR ? parseInt(process.env.NEXT_PUBLIC_EST_YEAR) : 2025;

export async function GET(request: NextRequest) {
  try {
    const user_id = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);
    
    console.log("🚀 ~ GET ~ user_id:", user_id)

    const search_params = request.nextUrl.searchParams;
    const time_period = search_params.get('time_period') || 'month';
    const specific_time_str = search_params.get('specific_time');

    // Validate time_period
    const valid_time_periods = ['day', 'week', 'month', 'year'];

    if (!valid_time_periods.includes(time_period)) {
      throw new ApiError(`Invalid time_period. Must be one of: ${valid_time_periods.join(', ')}`, 400);
    }

    let parsed_specific_time: number | null = null;

    if (specific_time_str) {
      parsed_specific_time = parseInt(specific_time_str, 10);

      if (isNaN(parsed_specific_time)) {
        throw new ApiError('Invalid specific_time. Must be a valid number', 400);
      }

      // Validate month range (1-12)
      if (time_period === 'month' && (parsed_specific_time < 1 || parsed_specific_time > 12)) {
        throw new ApiError('Invalid specific_time for month. Must be between 1-12', 400);
      }

      // Validate year range
      if (time_period === 'year' && (parsed_specific_time < EST_YEAR || parsed_specific_time > new Date().getFullYear() + 1)) {
        throw new ApiError(`Invalid specific_time for year. Must be between ${EST_YEAR}-${new Date().getFullYear() + 1}`, 400);
      }
    }

    const [
      analytics,
      cards,
      category_breakdown,
      monthly_analytics,
      transactions_result,
      upcoming_recurrings_instances,
      upcoming_recurrings_analysis
    ] = await Promise.all([
      calculateAnalytics(user_id, time_period, parsed_specific_time),
      getAllCardsOfUser(user_id),
      getCategoryStatsByUserId(user_id),
      getMonthlyAnalyticsData(user_id),
      getAllTransactions(user_id, 1, 5, '', '', '', 'date_desc'),
      (async () => {
        await updateOverdueInstances(user_id);
        const filters: TRecurringInstanceFilters = {
          status: 'pending',
          days_ahead: 30
        };

        return getRecurringInstancesWithBalances(user_id, filters);
      })(),
      getRecurringAnalysis(user_id, null)
    ]);

    const dashboardData = {
      analytics,
      cards,
      category_breakdown,
      monthly_analytics,
      recent_transactions: transactions_result.transactions,
      upcoming_recurrings: {
        instances: upcoming_recurrings_instances,
        analysis: upcoming_recurrings_analysis
      }
    };

    return NextResponse.json({
      status: "success",
      message: "Dashboard data retrieved successfully",
      results: dashboardData
    });

  } catch (error: unknown) {
    return handleError(error);
  }
}

