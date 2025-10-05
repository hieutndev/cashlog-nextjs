import { NextRequest } from "next/server";

import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { zodValidate } from "@/utils/zod-validate";
import {
    addNewTransaction,
    deleteTransaction,
    getAllTransactions,
    addTransactionPayload
} from "@/app/api/transactions/transaction-services";
import { ApiError } from "@/types/api-error";
import { TUser } from "@/types/user";

export const GET = async (request: NextRequest) => {
    try {
        const userId = getFromHeaders(request, "x-user-id", '');
        const { searchParams } = new URL(request.url);

        // Parse pagination parameters with defaults
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10))); // Cap at 100

        // Parse filter parameters
        const search = searchParams.get('search') || '';
        const cardId = searchParams.get('cardId') || '';
        const transactionType = searchParams.get('transactionType') || '';
        const sortBy = searchParams.get('sortBy') || 'date_desc';

        console.log('userId', userId, 'page', page, 'limit', limit, 'search', search, 'cardId', cardId, 'transactionType', transactionType, 'sortBy', sortBy);

        const { transactions, total } = await getAllTransactions(userId, page, limit, search, cardId, transactionType, sortBy);
        const totalPages = Math.ceil(total / limit);

        return Response.json(
            {
                status: "success",
                message: "Get all transactions successfully",
                results: transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages
                }
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
        const user_id = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);
        const body = await request.json();

        const { is_valid, errors } = zodValidate(addTransactionPayload, body);

        if (!is_valid) {
            return handleValidateError(errors);
        }

        await addNewTransaction(body, user_id);

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

        const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);
        const searchParams = new URL(request.url).searchParams;
        const transactionId = searchParams.get("transaction_id");

        if (!transactionId) {
            return handleError(new ApiError("Transaction ID is required", 404));
        }


        if (await deleteTransaction(transactionId, userId)) {
            return Response.json({
                status: "success",
                message: "Delete transaction successfully"
            });
        }
    } catch (error: unknown) {
        return handleError(error);
    }
}