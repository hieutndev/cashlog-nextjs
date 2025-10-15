import { handleError } from "@/app/api/_helpers/handle-error";
import { getFromHeaders } from "@/app/api/_helpers/get-from-headers";
import { getTransactionById, updateTransaction } from "@/app/api/_services/transaction-services";
import { TUser } from "@/types/user";

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