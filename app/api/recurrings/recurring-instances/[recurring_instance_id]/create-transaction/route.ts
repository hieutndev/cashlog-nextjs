import { NextRequest, NextResponse } from 'next/server';

import { createTransactionFromInstance, RecurringInstanceRouteProps } from '@/app/api/_services/recurring-services';
import { createTransactionFromInstancePayload } from '@/app/api/_services/recurring-services';
import { getFromHeaders } from '@/app/api/_helpers/get-from-headers';
import { TUser } from '@/types/user';
import { handleError, handleValidateError } from '@/app/api/_helpers/handle-error';
import { zodValidate } from '@/utils/zod-validate';

export async function POST(
  request: NextRequest,
  { params }: RecurringInstanceRouteProps
) {
  try {
    const user_id = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);

    const body = await request.json();

    const { recurring_instance_id } = await params;

    const { is_valid, errors } = zodValidate(createTransactionFromInstancePayload, body);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    return NextResponse.json({
      success: true,
      message: "Transaction created successfully",
      results: await createTransactionFromInstance(Number(recurring_instance_id), Number(user_id), {
        amount: body.amount,
        transaction_date: body.transaction_date,
        category_id: body.category_id,
        note: body.note,
      }),
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}
