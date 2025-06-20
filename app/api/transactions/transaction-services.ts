import { ResultSetHeader, RowDataPacket } from "mysql2";

import { TFullTransaction, TNewTransaction, TTransaction, TTransactionDetail } from "@/types/transaction";
import { dbQuery } from "@/libs/mysql";
import { QUERY_STRING } from "@/config/query-string";
import { formatMYSQLDate } from "@/utils/text-transform";
import { ApiError } from "@/types/api-error";
import { validateCardOwnership } from "@/app/api/cards/card-services";

export const getTotalTransaction = async () => {

  try {

    const totalTransaction = await dbQuery<RowDataPacket[]>(
      QUERY_STRING.GET_COUNT_TRANSACTION
    );

    return totalTransaction[0].total;

  } catch (error: unknown) {

    throw new Error((error as Error).message || "Error in getTotalTransaction");

  }


};

export const createNewTransaction = async ({
  card_id,
  direction,
  transaction_date,
  transaction_category

}: TTransaction, userId?: string | number) => {

  // Validate card ownership if userId is provided
  if (userId) {
    await validateCardOwnership(card_id, userId);
  }

  let createTransaction: ResultSetHeader | null = null;

  try {
    createTransaction = await dbQuery<ResultSetHeader>(
      QUERY_STRING.NEW_TRANSACTION,
      [
        card_id,
        direction,
        transaction_category === -1 ? null : transaction_category,
        formatMYSQLDate(transaction_date)
      ]
    );

  } catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in createNewTransaction", 500);
  }

  if (!createTransaction || createTransaction.affectedRows === 0) {
    throw new ApiError("Failed to create new transaction", 500);
  }

  return createTransaction.insertId;

};

export const createNewTransactionDetail = async ({
  transaction_id,
  transaction_type,
  transaction_amount,
  description
}: TTransactionDetail) => {
  let createTransactionDetail: ResultSetHeader | null = null;

  try {
    createTransactionDetail = await dbQuery<ResultSetHeader>(
      QUERY_STRING.NEW_TRANSACTION_DETAIL,
      [transaction_id, transaction_type, transaction_amount, description]
    );
  } catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in createNewTransactionDetail", 500);
  }

  if (!createTransactionDetail || createTransactionDetail.affectedRows === 0) {
    throw new ApiError("Failed to create new transaction detail", 500);
  }

  return createTransactionDetail.insertId;

};

export const updateCardBalance = async ({
  card_id,
  transaction_amount,
  direction
}: Pick<TNewTransaction, "card_id" | "transaction_amount" | "direction">, userId?: string | number) => {

  // Validate card ownership if userId is provided
  if (userId) {
    await validateCardOwnership(card_id, userId);
  }

  let updateCardBalance: ResultSetHeader | null = null;

  try {
    updateCardBalance = await dbQuery<ResultSetHeader>(
      QUERY_STRING.UPDATE_CARD_BALANCE,
      [direction === "in" ? transaction_amount : -transaction_amount, card_id]
    );
  } catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in updateCardBalance", 500);
  }

  if (!updateCardBalance || updateCardBalance.affectedRows === 0) {
    throw new ApiError("Failed to update card balance", 500);
  }

  return true

};

export const getAllTransactions = async (userId: string | number) => {

  let listTransaction: RowDataPacket[] | null = null;

  try {
    listTransaction = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_ALL_TRANSACTIONS_OF_USER, [userId]);
  } catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in getAllTransactions", 500);
  }

  return listTransaction;

};

export const getTransactionById = async (transactionId: string | number, userId: string | number) => {

  let transactionInfo: TFullTransaction[] | null = null;

  try {
    transactionInfo = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_TRANSACTION_BY_ID, [transactionId]) as TFullTransaction[];
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


export const deleteTransaction = async (transactionId: string | number, userId: string | number) => {
  let deleteStatus: ResultSetHeader | null = null;

  try {

    const transactionInfo = await getTransactionById(transactionId, userId);

    if (transactionInfo) {

      await updateCardBalance({
        card_id: transactionInfo.card_id,
        transaction_amount: transactionInfo.transaction_amount,
        direction: transactionInfo.direction === "in" ? "out" : "in"
      }, userId);

      deleteStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.DELETE_TRANSACTION, [transactionId]);
    }
  } catch (error: unknown) {
    throw error;
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