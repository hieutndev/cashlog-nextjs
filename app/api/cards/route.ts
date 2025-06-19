import { JSONSchemaType } from "ajv";

import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { TNewCard } from "@/types/card";
import { createNewCard, deleteCard, getAllCardsOfUser } from "@/app/api/cards/card-services";
import { validateRequest } from "@/utils/ajv";
import { ListColors } from "@/types/global";
import { ApiError } from "@/types/api-error";

export const GET = async (request: Request) => {
  try {

    const userId = getFromHeaders(request, "x-user-id", '');

    return Response.json(
      {
        status: "success",
        message: "Retrieved all cards successfully",
        results: await getAllCardsOfUser(userId)
      },
      {
        status: 200
      }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
};

export const POST = async (request: Request) => {
  try {

    const userId = getFromHeaders(request, "x-user-id", '');

    const requestBody = await request.json();

    const validateSchema: JSONSchemaType<TNewCard> = {
      type: "object",
      properties: {
        card_name: { type: "string", minLength: 3 },
        card_balance_init: { type: "integer", minimum: 0 },
        card_color: {
          type: "string",
          enum: ListColors
        },
        bank_code: { type: "string" }
      },
      required: ["card_name", "card_balance_init", "card_color", "bank_code"],
      additionalProperties: false
    };

    const { isValid, errors } = validateRequest(validateSchema, requestBody);

    if (!isValid) {
      return handleValidateError(errors);
    }

    return Response.json(
      {
        status: "success",
        message: "Created new card successfully",
        results: await createNewCard(requestBody, userId)
      },
      {
        status: 201
      }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
};

export const DELETE = async (request: Request) => {
  try {

    const userId = getFromHeaders(request, "x-user-id", '');

    const url = new URL(request.url);
    const cardId = url.searchParams.get("cardId");

    if (!cardId) {
      return handleError(new ApiError("Card ID is required", 404));
    }

    if (await deleteCard(Number(cardId), userId)) {
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
};
