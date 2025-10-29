import { TAnalyticsResponse, TMonthlyAnalyticsResponse } from "./analytics";
import { TCard } from "./card";
import { TRecurringInstancesResponse } from "./recurring";
import { TTransaction } from "./transaction";

export type TCategoryBreakdown = {
  category: string;
  color: string;
  total: number;
  income?: number;
  expense?: number;
};

export type TDashboardData = {
  analytics: TAnalyticsResponse;
  cards: TCard[];
  category_breakdown: TCategoryBreakdown[];
  monthly_analytics: TMonthlyAnalyticsResponse;
  recent_transactions: TTransaction[];
  upcoming_recurrings: TRecurringInstancesResponse;
};


export type TDashboardQueryParams = {
  time_period?: string;
  specific_time?: string;
};

