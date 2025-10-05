import { NextRequest, NextResponse } from 'next/server';

import { markInstanceAsCompleted, RecurringInstanceRouteProps } from '../../../recurring-services';

import { getFromHeaders } from '@/app/api/_helpers/get-from-headers';
import { TUser } from '@/types/user';
import { handleError } from '@/app/api/_helpers/handle-error';



export async function POST(
  request: NextRequest,
  { params }: RecurringInstanceRouteProps
) {
  try {
    const user_id = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);

    const { recurring_instance_id } = await params;

    const request_body = await request.json();

    // Extract overrides
    const overrides: any = {};

    if (request_body.actual_date) {
      overrides.actual_date = request_body.actual_date;
    }

    if (request_body.actual_amount !== undefined) {
      if (request_body.actual_amount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be positive' },
          { status: 400 }
        );
      }

      overrides.actual_amount = request_body.actual_amount;
    }

    if (request_body.notes) {
      overrides.notes = request_body.notes;
    }

    // Mark as completed
    const result = await markInstanceAsCompleted(Number(recurring_instance_id), Number(user_id), overrides);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}
