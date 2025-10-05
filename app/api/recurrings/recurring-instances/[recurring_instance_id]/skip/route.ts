import { NextRequest, NextResponse } from 'next/server';

import { RecurringInstanceRouteProps, skipInstance } from '../../../recurring-services';

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

    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: await skipInstance(Number(recurring_instance_id), Number(user_id), body.reason || null),
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}
