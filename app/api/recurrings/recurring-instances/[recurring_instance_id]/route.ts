import { NextResponse } from "next/server";

import { getRecurringInstanceById, RecurringInstanceRouteProps } from "../../recurring-services";

import { getFromHeaders } from "@/app/api/_helpers/get-from-headers";
import { handleError } from "@/app/api/_helpers/handle-error";
import { TUser } from "@/types/user";


export const GET = async (
  request: Request,
  { params }: RecurringInstanceRouteProps
) => {
  try {
    const user_id = getFromHeaders<TUser['user_id']>(request, 'x-user-id', 0);

    const { recurring_instance_id } = await params;

    return NextResponse.json({
      success: true,
      results: await getRecurringInstanceById(Number(recurring_instance_id), Number(user_id)),
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}
