import {handleError} from "@/app/api/_helpers/handle-error";
import {getFromHeaders} from "@/app/api/_helpers/get-from-headers";
import {updateTransaction} from "@/app/api/transactions/transaction-services";

interface TransactionDetailsRouteProps {
    params: Promise<{ transactionId: string }>
}

export const PUT = async (request: Request, {params}: TransactionDetailsRouteProps) => {
    try {
        // get dynamic transactionId
        const {transactionId} = await params;

        const userId = getFromHeaders<number>(request, "x-user-id", -1);

        await updateTransaction(transactionId, await request.json(), userId);

        return Response.json({
            status: "success",
            message: "Update transaction details successfully"
        });

    } catch (error: unknown) {
        return handleError(error);
    }
}