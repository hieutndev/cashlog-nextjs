import {ResultSetHeader, RowDataPacket} from "mysql2";
import {JSONSchemaType} from "ajv";

import {TCrudTransaction, TTransaction} from "@/types/transaction";
import {dbQuery} from "@/libs/mysql";
import {QUERY_STRING} from "@/configs/query-string";
import {formatMYSQLDate} from "@/utils/text-transform";
import {ApiError} from "@/types/api-error";
import {validateCardOwnership} from "@/app/api/cards/card-services";
import {TUser} from "@/types/user";

// @ts-ignore
export const newTransactionSchema: JSONSchemaType<TCrudTransaction> = {
    type: "object",
    properties: {
        amount: {type: "number", minimum: 1},
        date: {type: "string", format: "date-time"}, // or just "date" if that's what you expect
        description: {type: "string"},
        direction: {type: "string", enum: ["in", "out"]},
        card_id: {type: "number", minimum: 1},
        category_id: {type: "number", nullable: true},
    },
    required: [
        "amount",
        "date",
        "direction",
        "card_id",
    ],
    additionalProperties: false
};

export const createNewTransaction = async ({
                                               card_id,
                                               direction,
                                               amount,
                                               date,
                                               description,
                                               category_id,
                                           }: TCrudTransaction, user_id: TUser["user_id"]) => {

    // Validate card ownership if userId is provided
    if (user_id) {
        await validateCardOwnership(card_id, user_id);
    }

    let createTransaction: ResultSetHeader | null = null;

    try {
        createTransaction = await dbQuery<ResultSetHeader>(
            QUERY_STRING.ADD_TRANSACTION,
            [
                amount, formatMYSQLDate(date), description, direction, card_id, category_id ?? null,
            ]
        );

    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in createNewTransaction", 500);
    }

    if (!createTransaction || createTransaction.affectedRows === 0) {
        throw new ApiError("Failed to create new transaction", 500);
    }

    await updateCardBalance(card_id, user_id);

    return createTransaction.insertId;

};

const getAllTransactionOfCard = async (card_id: number): Promise<TTransaction[]> => {
    try {

        const listTransaction = await dbQuery<RowDataPacket[]>(
            QUERY_STRING.GET_ALL_TRANSACTIONS_OF_CARD,
            [card_id]
        );

        return listTransaction as TTransaction[];

    } catch (error: unknown) {
        console.log("error in getAllTransactionOfCard", error);
        throw new ApiError("Error while fetching transactions", 500);
    }


}

export const calculateCardBalance = async (card_id: number) => {
    try {

        const listTransaction = await getAllTransactionOfCard(card_id);

        return listTransaction.reduce((total, transaction) => {
            return total + (transaction.direction === "in" ? transaction.amount : -transaction.amount);
        }, 0);

    } catch (error: unknown) {
        console.log('error in calculateCardBalance', error);
        throw new ApiError("Failed to calculate card balance", 500);
    }
}

export const updateCardBalance = async (card_id: number, user_id: number) => {

    // Validate card ownership if userId is provided
    if (user_id) {
        await validateCardOwnership(card_id, user_id);
    }

    try {
        const newBalance = await calculateCardBalance(card_id);

        return dbQuery(QUERY_STRING.UPDATE_CARD_BALANCE, [newBalance, card_id]);
    } catch (error: unknown) {
        console.log('error in updateCardBalance', error);
        throw new ApiError("Error while updating card balance", 500);
    }

};

export const getAllTransactions = async (userId: string | number) => {

    let listTransaction: RowDataPacket[] | null = null;

    try {
        listTransaction = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_ALL_TRANSACTIONS_WITH_CARD_AND_CATEGORY_BY_USER_ID, [userId]);
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in getAllTransactions", 500);
    }

    return listTransaction;

};

export const getTransactionById = async (transactionId: TTransaction["transaction_id"], userId: TUser["user_id"]) => {

    let transactionInfo: TTransaction[] | null = null;

    try {
        transactionInfo = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_TRANSACTION_BY_ID, [transactionId]) as TTransaction[];
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in getTransactionById", 500);
    }

    if (transactionInfo.length === 0) {
        return null;
    }

    if (!await validateCardOwnership(transactionInfo[0].card_id, userId)) {
        throw new ApiError("You do not have permission to retrieve this transaction info", 403);
    }

    return transactionInfo[0];

};


export const deleteTransaction = async (transactionId: TTransaction["transaction_id"], userId: TUser["user_id"]) => {
    let deleteStatus: ResultSetHeader | null = null;

    try {

        const transactionInfo = await getTransactionById(transactionId, userId);

        if (transactionInfo) {
            deleteStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.DELETE_TRANSACTION, [transactionId]);
            await updateCardBalance(transactionInfo?.card_id, userId);
        }
    } catch (error: unknown) {
        console.log('error in deleteTransaction', error);
        throw new ApiError((error as Error).message || "Error in deleteTransaction", 500);
    }

    if (!deleteStatus || deleteStatus.affectedRows === 0) {
        throw new ApiError("Failed to delete transaction", 500);
    }

    return Response.json({
        status: "success",
        message: "Delete transaction successfully"
    }, {
        status: 202,
    })
}

export const updateTransaction = async (transaction_id: TTransaction["transaction_id"], {
    date,
    description,
    category_id,
    card_id,
    direction,
    amount
}: TCrudTransaction, user_id: TUser["user_id"]) => {

    let updateTransactionStatus: ResultSetHeader | null = null;

    try {
        updateTransactionStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.UPDATE_TRANSACTION, [amount, formatMYSQLDate(date), description, direction, card_id, category_id, transaction_id])
    } catch (error: unknown) {
        console.log("🚀 ~ updateTransaction ~ error: ", error);

        throw new ApiError("Error while update transaction", 500);
    }

    if (!updateTransactionStatus || updateTransactionStatus.affectedRows === 0) {
        console.log("🚀 ~ updateTransaction ~ updateTransactionStatus: ", updateTransactionStatus);
        throw new ApiError("Failed to update transaction", 500);
    }

    try {
        await updateCardBalance(card_id, user_id);
    } catch (error: unknown) {
        throw error;
    }

    return true;
}


