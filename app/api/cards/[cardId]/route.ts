import { JSONSchemaType } from "ajv";

import { deleteCard, getCardInfoById, updateCardInfo } from "../card-services";
import { handleError, handleValidateError } from '../../_helpers/handle-error';
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { validateRequest } from "@/utils/ajv";
import { TCard, TEditCard } from "@/types/card";
import { ListColors } from "@/types/global";

interface CardDetailRouteProps {
  params: Promise<{ cardId: string }>;
}

export const GET = async (
  request: Request,
  { params }: CardDetailRouteProps
) => {

  const userId = getFromHeaders(request, "x-user-id", '');

  const queryParams = await params;

  const validateSchema: JSONSchemaType<{ cardId: string }> = {
    type: "object",
    properties: {
      cardId: { type: "string", minLength: 1, pattern: "^[0-9]+$" }
    },
    required: ["cardId"],
    additionalProperties: false
  };

  try {
    const { isValid, errors } = validateRequest(validateSchema, queryParams);

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

    const validateSchema: JSONSchemaType<TEditCard & { cardId: string }> = {
      type: "object",
      properties: {
        cardId: { type: "string", minLength: 1, pattern: "^[0-9]+$" },
        card_name: { type: "string", minLength: 3 },
        card_color: {
          type: "string",
          enum: ListColors
        },
        bank_code: { type: "string" }
      },
      required: ["cardId", "card_name", "card_color", "bank_code"],
      additionalProperties: false
    };

    const { isValid, errors } = validateRequest(validateSchema, {
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

    const validateSchema: JSONSchemaType<{ cardId: string }> = {
      type: "object",
      properties: {
        cardId: { type: "string", minLength: 1, pattern: "^[0-9]+$" }
      },
      required: ["cardId"],
      additionalProperties: false
    };

    const { isValid, errors } = validateRequest(validateSchema, queryParams);

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