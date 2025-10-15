import { NextRequest, NextResponse } from 'next/server';

import { getFromHeaders } from '../_helpers/get-from-headers';
import { handleError, handleValidateError } from '../_helpers/handle-error';

import { getAllRecurringsByUser, addNewRecurring, addRecurringsPayload, getAllRecurringsQueryParams } from '@/app/api/_services/recurring-services';
import { TRecurringFilters, TRecurringStatus, TFrequencyType } from '@/types/recurring';
import { TUser } from '@/types/user';
import { zodValidate } from '@/utils/zod-validate';

export async function GET(request: NextRequest) {
  try {

    const userId = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);

    const searchParams = request.nextUrl.searchParams;
    const filters: TRecurringFilters = {};

    const { is_valid, errors } = zodValidate(getAllRecurringsQueryParams, filters);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status') as TRecurringStatus;
    }

    if (searchParams.get('is_active') !== null) {
      filters.is_active = searchParams.get('is_active') === 'true';
    }

    if (searchParams.get('card_id')) {
      filters.card_id = Number(searchParams.get('card_id'));
    }

    if (searchParams.get('frequency')) {
      filters.frequency = searchParams.get('frequency') as TFrequencyType;
    }



    return NextResponse.json({
      status: "success",
      message: "Retrieved recurring transactions successfully",
      results: await getAllRecurringsByUser(userId, filters),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user_id = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);

    const body = await request.json();

    const { is_valid, errors } = zodValidate(addRecurringsPayload, body);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    return NextResponse.json({
      status: "success",
      message: "Created recurring transaction successfully",
      results: await addNewRecurring(user_id, body),
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
