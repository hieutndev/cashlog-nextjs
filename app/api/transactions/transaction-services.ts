import { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";

import { REQUIRED_HEADERS, TCrudTransaction, TTransaction } from "@/types/transaction";
import { dbQuery } from "@/libs/mysql";
import { QUERY_STRING } from "@/configs/query-string";
import { formatMYSQLDate } from "@/utils/text-transform";
import { ApiError } from "@/types/api-error";
import { syncAllCardsBalance, validateCardOwnership } from "@/app/api/cards/card-services";
import { TUser } from "@/types/user";
import { parseExcelFile, ParseExcelResult } from "@/libs/parseExcelFile";
import { VALIDATE_MESSAGE } from "@/utils/api/zod-validate-message";

// @ts-ignore
export const addTransactionPayload = z.object({
	amount: z.number().int({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO }).min(1),
	date: z.iso.datetime({ message: VALIDATE_MESSAGE.REQUIRE_ISO_DATE }),
	description: z.string().nullable().optional(),
	direction: z.enum(["in", "out"], { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
	card_id: z.coerce
		.number({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
		.positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO }),
	category_id: z.coerce
		.number({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
		.positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
		.nullable()
		.optional()
});

export const addMultipleTransactionsPayload = z.object({
	list_transactions: z.array(addTransactionPayload)
});

export const addNewTransaction = async (
	{ card_id, direction, amount, date, description, category_id }: TCrudTransaction,
	user_id: TUser["user_id"]
) => {

	await validateCardOwnership(card_id, user_id);


	const new_transaction = await dbQuery<ResultSetHeader>(QUERY_STRING.ADD_TRANSACTION, [
		amount,
		formatMYSQLDate(date),
		description,
		direction,
		card_id,
		category_id ?? null,
	]);

	await updateCardBalance(card_id, user_id);

	return new_transaction.insertId;

};

export const createMultipleTransaction = async (list_transactions: TCrudTransaction[], user_id: TUser["user_id"]) => {
	let success_count = 0;
	const errors: any[] = [];

	const promises = list_transactions.map(async (transaction) => {
		try {
			await addNewTransaction(transaction, user_id);
			success_count++;
		} catch (error: unknown) {
			errors.push({
				transaction,
				error: (error as Error).message || "Error in createMultipleTransaction",
			});
		}
	});

	await Promise.all(promises);

	return {
		success_count,
		error_count: errors.length,
		errors,
	};
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

export const getAllTransactions = async (
	userId: string | number,
	page: number = 1,
	limit: number = 10,
	search: string = '',
	cardId: string = '',
	transactionType: string = '',
	sortBy: string = 'date_desc'
) => {
	let listTransaction: RowDataPacket[] | null = null;
	let totalCount: RowDataPacket[] | null = null;

	try {
		// Calculate offset
		const offset = (page - 1) * limit;

		// Build dynamic WHERE conditions
		let whereConditions: string[] = ['u.user_id = ?'];
		let queryParams: any[] = [userId];
		let countParams: any[] = [userId];

		// Add search condition
		if (search.trim()) {
			whereConditions.push(`(
				LOWER(c.card_name) LIKE ? OR 
				LOWER(tc.category_name) LIKE ? OR 
				LOWER(tn.description) LIKE ? OR 
				LOWER(tn.amount) LIKE ? OR
				DATE_FORMAT(tn.date, '%Y-%m-%d') LIKE ? OR
				DATE_FORMAT(tn.date, '%d-%m-%Y') LIKE ? OR
				DATE_FORMAT(tn.date, '%Y/%m/%d') LIKE ? OR
				DATE_FORMAT(tn.date, '%d/%m/%Y') LIKE ?
			)`);
			const searchTerm = `%${search.trim().toLowerCase()}%`;
			const searchParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

			queryParams.push(...searchParams);
			countParams.push(...searchParams);
		}

		// Add card filter
		if (cardId.trim()) {
			whereConditions.push('c.card_id = ?');
			queryParams.push(parseInt(cardId));
			countParams.push(parseInt(cardId));
		}

		// Add transaction type filter
		if (transactionType.trim() && (transactionType === 'in' || transactionType === 'out')) {
			whereConditions.push('tn.direction = ?');
			queryParams.push(transactionType);
			countParams.push(transactionType);
		}

		// Build ORDER BY clause
		let orderBy = 'ORDER BY tn.date DESC';

		switch (sortBy) {
			case 'date_asc':
				orderBy = 'ORDER BY tn.date ASC';
				break;
			case 'amount_desc':
				orderBy = 'ORDER BY tn.amount DESC';
				break;
			case 'amount_asc':
				orderBy = 'ORDER BY tn.amount ASC';
				break;
			default:
				orderBy = 'ORDER BY tn.date DESC';
				break;
		}

		const whereClause = whereConditions.join(' AND ');

		// Build count query
		const countQuery = `
			SELECT COUNT(*) as total
			FROM transactions_new tn
			JOIN cards c ON tn.card_id = c.card_id
			JOIN users u ON c.user_id = u.user_id
			LEFT JOIN transaction_categories tc ON tn.category_id = tc.category_id
			WHERE ${whereClause}
		`;

		// Build data query
		const dataQuery = `
			SELECT tn.transaction_id,
				   tn.amount,
				   tn.date,
				   tn.description,
				   tn.direction,
				   tn.created_at,
				   c.card_id,
				   c.card_name,
				   c.card_balance,
				   c.card_color,
				   c.bank_code,
				   tc.category_id,
				   tc.category_name,
				   tc.color AS category_color,
				   u.user_id
			FROM transactions_new tn
			JOIN cards c ON tn.card_id = c.card_id
			JOIN users u ON c.user_id = u.user_id
			LEFT JOIN transaction_categories tc ON tn.category_id = tc.category_id
			WHERE ${whereClause}
			${orderBy}
			LIMIT ? OFFSET ?
		`;

		// Get total count for pagination
		totalCount = await dbQuery<RowDataPacket[]>(countQuery, countParams);

		// Get paginated transactions
		queryParams.push(limit, offset);
		listTransaction = await dbQuery<RowDataPacket[]>(dataQuery, queryParams);

		const total = totalCount && totalCount.length > 0 ? (totalCount[0] as any).total : 0;

		return {
			transactions: listTransaction,
			total
		};
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in getAllTransactions", 500);
	}
};

export const getTransactionById = async (transactionId: TTransaction["transaction_id"], userId: TUser["user_id"]) => {
	let transactionInfo: TTransaction[] | null = null;

	transactionInfo = (await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_TRANSACTION_BY_ID, [
		transactionId,
	])) as TTransaction[];

	if (transactionInfo.length === 0) {
		throw new ApiError("Transaction not found", 404);
	}

	if (!(await validateCardOwnership(transactionInfo[0].card_id, userId))) {
		throw new ApiError("You do not have permission to retrieve this transaction info", 403);
	}

	return transactionInfo[0];
};

export const deleteTransaction = async (transactionId: TTransaction["transaction_id"], userId: TUser["user_id"]) => {

	const transactionInfo = await getTransactionById(transactionId, userId);
	const recurringInstanceCheck = await dbQuery<RowDataPacket[]>(
		`SELECT instance_id, recurring_id 
				 FROM recurring_instances 
				 WHERE transaction_id = ?`,
		[transactionId]
	);

	if (recurringInstanceCheck && recurringInstanceCheck.length > 0) {
		const instance = recurringInstanceCheck[0];

		await dbQuery(
			`UPDATE recurring_instances
					 SET status = 'pending', 
					     transaction_id = NULL, 
					     actual_date = NULL, 
					     actual_amount = NULL,
					     completed_at = NULL,
					     updated_at = NOW()
					 WHERE instance_id = ?`,
			[instance.instance_id]
		);

		await dbQuery(
			`INSERT INTO recurring_history (
						recurring_id, user_id, instance_id, action, reason
					 ) VALUES (?, ?, ?, 'instance_reset', 'Transaction deleted')`,
			[instance.recurring_id, userId, instance.instance_id]
		);
	}

	await dbQuery<ResultSetHeader>(QUERY_STRING.DELETE_TRANSACTION, [transactionId]);
	await updateCardBalance(transactionInfo?.card_id, userId);

	return true;
};

export const updateTransaction = async (
	transaction_id: TTransaction["transaction_id"],
	{ date, description, category_id, card_id, direction, amount }: TCrudTransaction,
	user_id: TUser["user_id"]
) => {

	await validateCardOwnership(card_id, user_id);

	await validateTransactionOwnership(transaction_id, user_id);

	await dbQuery<ResultSetHeader>(QUERY_STRING.UPDATE_TRANSACTION, [
		amount,
		formatMYSQLDate(date),
		description,
		direction,
		card_id,
		category_id,
		transaction_id,
	]);

	await syncAllCardsBalance(user_id);

	return true;
};

export const validateTransactionOwnership = async (
	transactionId: TTransaction["transaction_id"],
	userId: TUser["user_id"]
) => {
	const transactionInfo = await getTransactionById(transactionId, userId);

	if (!transactionInfo) {
		throw new ApiError("Transaction not found", 404);
	}

	if (!(await validateCardOwnership(transactionInfo.card_id, userId))) {
		throw new ApiError("You do not have permission to access this transaction", 403);
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

export const readXlsxFile = async (file: File) => {
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

	if (result.headers.length > 6) {
		throw new ApiError(
			`Too many columns in the file. Expected ${REQUIRED_HEADERS.length} columns but found ${result.headers.length}. Please ensure the file contains only the required headers: \`${REQUIRED_HEADERS.join("`, `")}\`.`,
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
