import { NextRequest } from "next/server";

import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { validateRequest } from "@/utils/ajv";
import {
    createNewTransaction,
    deleteTransaction,
    getAllTransactions,
    newTransactionSchema
} from "@/app/api/transactions/transaction-services";
import { ApiError } from "@/types/api-error";

export const GET = async (request: NextRequest) => {
    try {
        const userId = getFromHeaders(request, "x-user-id", '');
        const { searchParams } = new URL(request.url);
        
        // Parse pagination parameters with defaults
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10))); // Cap at 100
        
        // Parse search parameter
        const search = searchParams.get('search') || '';

        console.log('userId', userId, 'page', page, 'limit', limit, 'search', search);

        const { transactions, total } = await getAllTransactions(userId, page, limit, search);
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
        const userId = Number(getFromHeaders(request, "x-user-id", -1));
        const requestBody = await request.json();


        const { isValid, errors } = validateRequest(newTransactionSchema, requestBody);

        if (!isValid) {
            return handleValidateError(errors);
        }

        await createNewTransaction(requestBody, userId);

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

        const userId = Number(getFromHeaders(request, "x-user-id", 0));
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
    } catch (error: unknown) {
        return handleError(error);
    }
}