import { JSONSchemaType } from "ajv";
import { NextRequest } from "next/server";

import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { ListTransactionType, TNewTransaction } from "@/types/transaction";
import { validateRequest } from "@/utils/ajv";
import {
  createNewTransaction,
  createNewTransactionDetail,
  deleteTransaction,
  getAllTransactions,
  updateCardBalance
} from "@/app/api/transactions/transaction-services";
import { ApiError } from "@/types/api-error";

export const GET = async (request: NextRequest) => {
  try {

    const userId = getFromHeaders(request, "x-user-id", '');

    console.log('userId', userId);


    const allTransactions = await getAllTransactions(userId);

    return Response.json(
      {
        status: "success",
        message: "Get all transactions successfully",
        results: allTransactions,
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

    const validateSchema: JSONSchemaType<TNewTransaction> = {
      type: "object",
      properties: {
        card_id: { type: ["string", "integer"], minimum: 1, minLength: 1 },
        direction: { type: "string", enum: ["in", "out"] },
        transaction_category: { type: "integer" },
        transaction_date: {
          anyOf: [
            { type: "string", format: "date" },
            { type: "string", format: "date-time" }
          ]
        },
        transaction_type: { type: "string", enum: ListTransactionType },
        transaction_amount: { type: "number", minimum: 1 },
        description: { type: "string" }
      },
      required: [
        "card_id",
        "direction",
        "transaction_type",
        "transaction_amount"
      ],
      additionalProperties: false
    };

    const { isValid, errors } = validateRequest(validateSchema, requestBody);

    if (!isValid) {
      return handleValidateError(errors);
    }

    const newTransactionId = await createNewTransaction(requestBody, userId);

    await Promise.all([
      createNewTransactionDetail({
        transaction_id: newTransactionId,
        ...requestBody
      }),
      updateCardBalance(requestBody, userId)
    ]);

    return Response.json({
      status: "success",
      message: "Created new transaction successfully"
    });

  } catch (error: unknown) {
    return handleError(error);
  }
};

export const DELETE = async (request: Request) => {
  try {

    const userId = getFromHeaders(request, "x-user-id", '');
    const searchParams = new URL(request.url).searchParams;
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return handleError(new ApiError("Transaction ID is required", 404));
    }


    if (await deleteTransaction(transactionId, userId)) {
      return Response.json({
        status: "success",
        message: "Delete transaction successfully"
      });
    }
  }
  catch (error: unknown) {
    return handleError(error);
  }
}