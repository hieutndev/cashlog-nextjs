
import { deleteCard, editCardSchema, getCardInfoById, getCardInfoSchema, updateCardInfo } from "../card-services";
import { handleError, handleValidateError } from '../../_helpers/handle-error';
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { validateRequest } from "@/utils/ajv";
import { TCard } from "@/types/card";

interface CardDetailRouteProps {
  params: Promise<{ cardId: string }>;
}

export const GET = async (
  request: Request,
  { params }: CardDetailRouteProps
) => {

  const userId = getFromHeaders(request, "x-user-id", '');

  const queryParams = await params;



  try {
    const { isValid, errors } = validateRequest(getCardInfoSchema, queryParams);

    if (!isValid) {
      return handleValidateError(errors);
    }

    return Response.json(
      {
        status: "success",
        message: "Retrieved card information successfully",
        results: await getCardInfoById(+queryParams.cardId, userId)
      },
      {
        status: 200
      }
    );
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



    const { isValid, errors } = validateRequest(editCardSchema, {
      cardId: queryParams.cardId,
      ...requestBody
    });

    if (!isValid) {
      return handleValidateError(errors);
    }

    if (await updateCardInfo(+queryParams.cardId, requestBody, userId)) {
      return Response.json(
        {
          status: "success",
          message: "Updated card information successfully",
        },
        {
          status: 200
        }
      );
    }

  } catch (error: unknown) {
    return handleError(error);
  }
};

export const DELETE = async (request: Request, { params }: CardDetailRouteProps) => {
  try {


    const userId = getFromHeaders(request, "x-user-id", '');

    const queryParams = await params;

    const { isValid, errors } = validateRequest(getCardInfoSchema, queryParams);

    if (!isValid) {
      return handleValidateError(errors);
    }

    if (await deleteCard(+queryParams.cardId, userId)) {
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