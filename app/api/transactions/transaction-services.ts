import { ResultSetHeader, RowDataPacket } from "mysql2";
import { JSONSchemaType } from "ajv";

import { REQUIRED_HEADERS, TCrudTransaction, TTransaction } from "@/types/transaction";
import { dbQuery } from "@/libs/mysql";
import { QUERY_STRING } from "@/configs/query-string";
import { formatMYSQLDate } from "@/utils/text-transform";
import { ApiError } from "@/types/api-error";
import { validateCardOwnership } from "@/app/api/cards/card-services";
import { TUser } from "@/types/user";
import { parseExcelFile, ParseExcelResult } from "@/libs/parseExcelFile";

// @ts-ignore
export const newTransactionSchema: JSONSchemaType<TCrudTransaction> = {
	type: "object",
	properties: {
		amount: { type: "number", minimum: 1 },
		date: { type: "string", format: "date-time" }, // or just "date" if that's what you expect
		description: { type: "string" },
		direction: { type: "string", enum: ["in", "out"] },
		card_id: { type: "number", minimum: 1 },
		category_id: { type: "number", nullable: true },
	},
	required: ["amount", "date", "direction", "card_id"],
	additionalProperties: false,
};

export const validateNewMultipleTransactionSchema: JSONSchemaType<{ list_transactions: TCrudTransaction[] }> = {
	type: "object",
	properties: {
		list_transactions: {
			type: "array",
			items: newTransactionSchema,
		},
	},
	required: ["list_transactions"],
	additionalProperties: false,
};

export const createNewTransaction = async (
	{ card_id, direction, amount, date, description, category_id }: TCrudTransaction,
	user_id: TUser["user_id"]
) => {
	// Validate card ownership if userId is provided
	if (user_id) {
		await validateCardOwnership(card_id, user_id);
	}

	let createTransaction: ResultSetHeader | null = null;

	try {
		createTransaction = await dbQuery<ResultSetHeader>(QUERY_STRING.ADD_TRANSACTION, [
			amount,
			formatMYSQLDate(date),
			description,
			direction,
			card_id,
			category_id ?? null,
		]);
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in createNewTransaction", 500);
	}

	if (!createTransaction || createTransaction.affectedRows === 0) {
		throw new ApiError("Failed to create new transaction", 500);
	}

	await updateCardBalance(card_id, user_id);

	return createTransaction.insertId;
};

export const createMultipleTransaction = async (list_transactions: TCrudTransaction[], user_id: TUser["user_id"]) => {
	try {
		let successCount = 0;
		const errors: any[] = [];
		const promises = list_transactions.map(async (transaction) => {
			try {
				await createNewTransaction(transaction, user_id);
				successCount++;
			} catch (error: unknown) {
				errors.push({
					transaction,
					error: (error as Error).message || "Error in createMultipleTransaction",
				});
			}
		});

		await Promise.all(promises);

		return {
			success_count: successCount,
			error_count: errors.length,
			errors,
		};
	} catch (error: unknown) {
		console.log("error in createMultipleTransaction", error);
		throw error;
	}
};

const getAllTransactionOfCard = async (card_id: number): Promise<TTransaction[]> => {
	try {
		const listTransaction = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_ALL_TRANSACTIONS_OF_CARD, [card_id]);

		return listTransaction as TTransaction[];
	} catch (error: unknown) {
		console.log("error in getAllTransactionOfCard", error);
		throw new ApiError("Error while fetching transactions", 500);
	}
};

export const calculateCardBalance = async (card_id: number) => {
	try {
		const listTransaction = await getAllTransactionOfCard(card_id);

		return listTransaction.reduce((total, transaction) => {
			return total + (transaction.direction === "in" ? transaction.amount : -transaction.amount);
		}, 0);
	} catch (error: unknown) {
		console.log("error in calculateCardBalance", error);
		throw new ApiError("Failed to calculate card balance", 500);
	}
};

export const updateCardBalance = async (card_id: number, user_id: number) => {
	// Validate card ownership if userId is provided
	if (user_id) {
		await validateCardOwnership(card_id, user_id);
	}

	try {
		const newBalance = await calculateCardBalance(card_id);

		return dbQuery(QUERY_STRING.UPDATE_CARD_BALANCE, [newBalance, card_id]);
	} catch (error: unknown) {
		console.log("error in updateCardBalance", error);
		throw new ApiError("Error while updating card balance", 500);
	}
};

export const getAllTransactions = async (userId: string | number, page: number = 1, limit: number = 10) => {
	let listTransaction: RowDataPacket[] | null = null;
	let totalCount: RowDataPacket[] | null = null;

	try {
		// Calculate offset
		const offset = (page - 1) * limit;

		// Get total count for pagination
		totalCount = await dbQuery<RowDataPacket[]>(
			QUERY_STRING.GET_TRANSACTIONS_COUNT_BY_USER_ID,
			[userId]
		);

		// Get paginated transactions
		listTransaction = await dbQuery<RowDataPacket[]>(
			QUERY_STRING.GET_ALL_TRANSACTIONS_WITH_CARD_AND_CATEGORY_BY_USER_ID_PAGINATED,
			[userId, limit, offset]
		);
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in getAllTransactions", 500);
	}

	const total = totalCount && totalCount.length > 0 ? (totalCount[0] as any).total : 0;

	return {
		transactions: listTransaction,
		total
	};
};

export const getTransactionById = async (transactionId: TTransaction["transaction_id"], userId: TUser["user_id"]) => {
	let transactionInfo: TTransaction[] | null = null;

	try {
		transactionInfo = (await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_TRANSACTION_BY_ID, [
			transactionId,
		])) as TTransaction[];
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in getTransactionById", 500);
	}

	if (transactionInfo.length === 0) {
		return null;
	}

	if (!(await validateCardOwnership(transactionInfo[0].card_id, userId))) {
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
		console.log("error in deleteTransaction", error);
		throw new ApiError((error as Error).message || "Error in deleteTransaction", 500);
	}

	if (!deleteStatus || deleteStatus.affectedRows === 0) {
		throw new ApiError("Failed to delete transaction", 500);
	}

	return Response.json(
		{
			status: "success",
			message: "Delete transaction successfully",
		},
		{
			status: 202,
		}
	);
};

export const updateTransaction = async (
	transaction_id: TTransaction["transaction_id"],
	{ date, description, category_id, card_id, direction, amount }: TCrudTransaction,
	user_id: TUser["user_id"]
) => {
	let updateTransactionStatus: ResultSetHeader | null = null;

	try {
		updateTransactionStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.UPDATE_TRANSACTION, [
			amount,
			formatMYSQLDate(date),
			description,
			direction,
			card_id,
			category_id,
			transaction_id,
		]);
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
};

const getMissingHeaders = (headers: string[]) => {
	const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

	if (missingHeaders.length > 0) {
		return missingHeaders;
	}

	return [];
};

export const processFile = async (file: File) => {
	// Parse Excel file
	const result = await parseExcelFile(file, {
		useFirstRowAsHeader: true,
		defaultValue: null,
	});

	// compare headers with required headers
	const missingHeaders = getMissingHeaders(result.headers ?? []);

	if (!result.headers || missingHeaders.length > 0) {
		throw new ApiError(
			`Missing required headers: ${missingHeaders.join(", ")}. Please ensure the file contains the following headers: ${REQUIRED_HEADERS.join(", ")}.`,
			404
		);
	}

	const mappedData: { [key: string]: any } = {};

	result.headers?.forEach((col, index) => {
		if (col === "date") {
			mappedData[col] = getDataByColumnName(result.data, index).map((value) => {
				if (typeof value === "number") {
					// Excel dates are days since 1899-12-30
					const excelEpoch = new Date(Date.UTC(1899, 11, 30));
					const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);

					return date;
				}
				// Try to parse string date, or return as is
				const parsed = new Date(value);

				return isNaN(parsed.getTime()) ? value : parsed;
			});
		} else if (col === "card_name") {
			const tempData = getDataByColumnName(result.data, index);

			if (tempData.filter((item) => item === "").length > 0) {
				throw new ApiError(
					"`card_name` column cannot contain empty values. Please ensure all rows have a valid card name.",
					404
				);
			}

			if (tempData) {
				mappedData[col] = tempData;
			}
		} else if (col === "amount") {
			mappedData[col] = getDataByColumnName(result.data, index).map((value) => {
				const parsed = Number(value);

				if (isNaN(parsed)) {
					throw new ApiError(
						"`amount` column must contain valid numbers. Please ensure all rows have a valid amount.",
						404
					);
				}

				return parsed;
			});
		} else if (col === "direction") {
			console.log(getDataByColumnName(result.data, index).filter((item) => item !== "in" && item !== "out"));
			
	
			mappedData[col] = getDataByColumnName(result.data, index);
		} else {
			mappedData[col] = getDataByColumnName(result.data, index);
		}
	});

	const set_categories = Array.from(
		new Set(getDataByColumnName(result.data, result.headers?.indexOf("category_name") ?? 0))
	).filter((item) => item !== null && item !== "");

	const set_cards = Array.from(
		new Set(getDataByColumnName(result.data, result.headers?.indexOf("card_name") ?? 0))
	).filter((item) => item !== null && item !== "");

	return {
		headers: result.headers,
		mapped_column_data: mappedData,
		set_data: {
			set_categories,
			set_cards,
		},
	};
};

const getDataByColumnName = (data: ParseExcelResult["data"], columnIndex: number) => {
	return data.map((_) => {
		return _[columnIndex] === null ? "" : _[columnIndex];
	});
};
