import { NextRequest, NextResponse } from 'next/server';

import { getProjectedBalance, addDays } from '../../recurring-services';

import { getFromHeaders } from '@/app/api/_helpers/get-from-headers';
import { TUser } from '@/types/user';
import { handleError } from '@/app/api/_helpers/handle-error';

export async function GET(request: NextRequest) {
  try {
    const user_id = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);

    const search_params = request.nextUrl.searchParams;
    const card_id = search_params.get('card_id');
    const up_to_date_str = search_params.get('up_to_date');
    const from_date_str = search_params.get('from_date');

    const from_date = from_date_str ?? new Date().toISOString();
    const up_to_date = up_to_date_str ?? addDays(new Date(), 90).toISOString();

    return NextResponse.json({
      success: true,
      data: await getProjectedBalance(user_id, Number(card_id), up_to_date, from_date),
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}
