import { handleError } from "@/app/api/_helpers/handle-error";
import { getFromHeaders } from "@/app/api/_helpers/get-from-headers";
import { deleteTransaction, getTransactionById, updateTransaction } from "@/app/api/_services/transaction-services";
import { TUser } from "@/types/user";
import { ApiError } from "@/types/api-error";

interface TransactionDetailsRouteProps {
    params: Promise<{ transaction_id: string }>
}

export const GET = async (request: Request, { params }: TransactionDetailsRouteProps) => {
    try {
        // get dynamic transactionId
        const { transaction_id } = await params;

        const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

        return Response.json({
            status: "success",
            message: "Get transaction details successfully",
            results: await getTransactionById(Number(transaction_id), userId)
        });

    } catch (error: unknown) {
        return handleError(error);
    }

}

export const PUT = async (request: Request, { params }: TransactionDetailsRouteProps) => {
    try {
        // get dynamic transactionId
        const { transaction_id } = await params;

        const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

        await updateTransaction(Number(transaction_id), await request.json(), userId);

        return Response.json({
            status: "success",
            message: "Update transaction details successfully"
        });

    } catch (error: unknown) {
        return handleError(error);
    }
}

export const DELETE = async (request: Request, { params }: TransactionDetailsRouteProps) => {
    try {

        const user_id = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);
        const { transaction_id } = await params;

        if (!transaction_id) {
            return handleError(new ApiError("Transaction ID is required", 404));
        }


        if (await deleteTransaction(Number(transaction_id), user_id)) {
            return Response.json({
                status: "success",
                message: "Delete transaction successfully"
            });
        }
    } catch (error: unknown) {
        return handleError(error);
    }
}