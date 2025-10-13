import { NextRequest, NextResponse } from 'next/server';

import { handleError, handleValidateError } from '../../_helpers/handle-error';
import { getRecurringById, updateRecurring, removeRecurring, updateRecurringPayload, deleteRecurring, getRecurringAnalysis } from '../recurring-services';
import { getFromHeaders } from '../../_helpers/get-from-headers';

import { TRemoveRecurringOptions } from '@/types/recurring';
import { zodValidate } from '@/utils/zod-validate';
import { TUser } from '@/types/user';

interface RecurringRouteProps {
  params: Promise<{ recurring_id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RecurringRouteProps
) {
  try {
    const user_id = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);

    const { recurring_id } = await params;

    return NextResponse.json({
      status: "success",
      message: "Retrieved recurring transaction successfully",
      results: await getRecurringById(Number(recurring_id), Number(user_id))
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RecurringRouteProps
) {
  try {
    const user_id = getFromHeaders<number>(request, 'x-user-id', 0);

    const { recurring_id } = await params;

    const request_body = await request.json();

    const { is_valid, errors } = zodValidate(updateRecurringPayload, request_body);

    if (!is_valid) {
      return handleValidateError(errors)
    }

    const { apply_to_future, recreate_instances, ...updates } = request_body;

    const result = await updateRecurring(Number(recurring_id), Number(user_id), updates, {
      apply_to_future: !!apply_to_future,
      recreate_instances: !!recreate_instances
    });

    return NextResponse.json({
      status: "success",
      message: "Updated recurring transaction successfully",
      results: result,
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RecurringRouteProps
) {
  try {
    const user_id = getFromHeaders<number>(request, 'x-user-id', 0);
    const { recurring_id } = await params;
    const searchParams = request.nextUrl.searchParams;


    if (searchParams.get('delete_recurring') === 'true') {
      await deleteRecurring(Number(recurring_id), Number(user_id));
    } else {

      const options: TRemoveRecurringOptions = {
        delete_instances: searchParams.get('delete_instances') === 'true',
        delete_future_only: searchParams.get('delete_future_only') === 'true',
        keep_completed_transactions: searchParams.get('keep_completed_transactions') === 'true'
      };

      await removeRecurring(Number(recurring_id), Number(user_id), options);
    }


    return NextResponse.json({
      status: "success",
      message: "Deleted recurring transaction successfully",
    });

  } catch (error: unknown) {
    return handleError(error);
  }
}
