import { NextRequest, NextResponse } from 'next/server';

import { getFromHeaders } from '../../_helpers/get-from-headers';
import { handleError } from '../../_helpers/handle-error';

import { getRecurringAnalysis, getRecurringInstancesWithBalances, updateOverdueInstances } from '@/app/api/_services/recurring-services';
import { TUser } from '@/types/user';
import { TRecurringInstanceFilters, TRecurringInstanceStatus } from '@/types/recurring';

export async function GET(request: NextRequest) {
  try {
    const user_id = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);

    const searchParams = request.nextUrl.searchParams;
    const filters: TRecurringInstanceFilters = {};

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as TRecurringInstanceStatus;
    }

    if (searchParams.get('card_id')) {
      filters.card_id = Number(searchParams.get('card_id'));
    }

    if (searchParams.get('recurring_id')) {
      filters.recurring_id = Number(searchParams.get('recurring_id'));
    }

    if (searchParams.get('from_date')) {
      filters.from_date = searchParams.get('from_date')!;
    }

    if (searchParams.get('to_date')) {
      filters.to_date = searchParams.get('to_date')!;
    }

    if (searchParams.get('days_ahead')) {
      filters.days_ahead = parseInt(searchParams.get('days_ahead')!);
    }

    await updateOverdueInstances(user_id);

    return NextResponse.json({
      status: "success",
      message: "Retrieved recurring instances successfully",
      results: {
        instances: await getRecurringInstancesWithBalances(user_id, filters),
        analysis: await getRecurringAnalysis(user_id, filters.card_id),
      }
    });
  } catch (error) {
    return handleError(error);
  }
}
