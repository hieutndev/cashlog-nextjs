
import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { addNewCard, deleteCard, getAllCardsOfUser, newCardPayload } from "@/app/api/cards/card-services";
import { zodValidate } from "@/utils/zod-validate";
import { ApiError } from "@/types/api-error";
import { TUser } from "@/types/user";

export const GET = async (request: Request) => {
  try {

    const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

    return Response.json({
      status: "success",
      message: "Retrieved all cards successfully",
      results: await getAllCardsOfUser(userId)
    });
  } catch (error: unknown) {
    return handleError(error);
  }
};

export const POST = async (request: Request) => {
  try {

    const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

    const requestBody = await request.json();

    const { is_valid, errors } = zodValidate(newCardPayload, requestBody);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    return Response.json(
      {
        status: "success",
        message: "Created new card successfully",
        results: await addNewCard(requestBody, userId)
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

    const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

    const url = new URL(request.url);
    const cardId = url.searchParams.get("card_id");

    if (!cardId) {
      return handleError(new ApiError("Card ID is required", 404));
    }

    const deleteStatus = await deleteCard(Number(cardId), userId);

    console.log("🚀 ~ DELETE ~ deleteStatus:", deleteStatus)

    if (deleteStatus) {
      return Response.json(
        {
          status: "success",
          message: "Deleted card successfully"
        }
      );
    } else {
      return handleError(new ApiError("Something wrong when deleting the card", 500));
    }
    
  } catch (error: unknown) {
    return handleError(error);
  }
};
