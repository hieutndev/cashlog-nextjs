
import { deleteCard, editCardSchema, getCardInfoById, cardQueryParams, updateCardInfo } from "../card-services";
import { handleError, handleValidateError } from '../../_helpers/handle-error';
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { zodValidate } from "@/utils/zod-validate";
import { TCard } from "@/types/card";
import { TUser } from "@/types/user";

interface CardDetailRouteProps {
  params: Promise<{ card_id: string }>;
}

export const GET = async (
  request: Request,
  { params }: CardDetailRouteProps
) => {
  try {

    const userId = getFromHeaders(request, "x-user-id", '');

    const queryParams = await params;

    const { is_valid, errors } = zodValidate(cardQueryParams, queryParams);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    return Response.json({
      status: "success",
      message: "Retrieved card information successfully",
      results: await getCardInfoById(Number(queryParams.card_id), userId)
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}

export const PUT = async (
  request: Request,
  { params }: CardDetailRouteProps
) => {
  try {

    const userId = getFromHeaders(request, "x-user-id", '');

    const queryParams = await params;

    const requestBody: TCard = await request.json();

    const { is_valid, errors } = zodValidate(editCardSchema, {
      ...requestBody,
      card_id: queryParams.card_id,
    });

    if (!is_valid) {
      return handleValidateError(errors);
    }

    if (await updateCardInfo(Number(queryParams.card_id), requestBody, userId)) {
      return Response.json({
        status: "success",
        message: "Updated card information successfully",
      });
    }

  } catch (error: unknown) {
    return handleError(error);
  }
};

export const DELETE = async (request: Request, { params }: CardDetailRouteProps) => {
  try {
    const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

    const queryParams = await params;

    const { is_valid, errors } = zodValidate(cardQueryParams, queryParams);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    if (await deleteCard(Number(queryParams.card_id), userId)) {
      return Response.json(
        {
          status: "success",
          message: "Deleted card successfully"
        },
        {
          status: 200
        }
      );
    }


  } catch (error: unknown) {
    return handleError(error);
  }
}