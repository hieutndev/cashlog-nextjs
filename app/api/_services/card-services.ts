import { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";

import { updateCardBalance } from "./transaction-services";

import { TCard, TUpdateCard, TAddNewCard } from "@/types/card";
import { dbQuery, mysqlPool } from "@/libs/mysql";
import { QUERY_STRING } from "@/configs/query-string";
import { ApiError } from "@/types/api-error";
import { LIST_COLORS } from "@/types/global";
import { TUser } from "@/types/user";
import { randomCardColor } from "@/utils/random-color";
import { LIST_BANKS } from "@/types/bank";
import { VALIDATE_MESSAGE } from "@/utils/api/zod-validate-message";

export const cardQueryParams = z.object({
	card_id: z.coerce
		.number({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
		.positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
});

export const newCardPayload = z.object({
	card_name: z.string({ message: VALIDATE_MESSAGE.REQUIRED_VALUE }).min(1),
	card_balance_init: z.number().int().min(0, { message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_ALLOW_ZERO }),
	card_color: z.enum(LIST_COLORS, { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
	bank_code: z.enum(LIST_BANKS, { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
	card_number: z.string().min(1, { message: VALIDATE_MESSAGE.REQUIRED_VALUE }),
});

export const createMultiCardsPayload = z.object({
	card_names: z.array(z.string().min(1)).min(1)
});

export const editCardSchema = z.object({
	card_id: z.coerce
		.number({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO })
		.positive({ message: VALIDATE_MESSAGE.REQUIRE_POSITIVE_NUMBER_NOT_ALLOW_ZERO }),
	card_name: z.string({ message: VALIDATE_MESSAGE.REQUIRED_VALUE }).min(1),
	card_color: z.enum(LIST_COLORS, { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
	bank_code: z.enum(LIST_BANKS, { message: VALIDATE_MESSAGE.INVALID_ENUM_VALUE }),
	card_number: z.string({ message: VALIDATE_MESSAGE.REQUIRED_VALUE }).min(1),
});

export const validateCardOwnership = async (cardId: TCard["card_id"], userId: TUser["user_id"]) => {


	const cardInfo = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CARD_INFO, [cardId]);

	if (!cardInfo || cardInfo.length === 0) {
		throw new ApiError("Card not found", 404);
	}

	if (Number(cardInfo[0].user_id) !== Number(userId)) {
		throw new ApiError("You do not have permission to access this card", 403);
	}

	return true;
};

export const getAllCardsOfUser = async (userId: string | number): Promise<TCard[]> => {
	try {
		const listCards = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_ALL_CARDS_OF_USER, [userId]);

		if (!listCards) {
			return [];
		}

		return listCards as TCard[];
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in getAllCards", 500);
	}
};

export const addNewCard = async (
	{ card_name, bank_code, card_balance_init, card_color, card_number }: TAddNewCard,
	userId: string | number
) => {
	const connection = await mysqlPool.getConnection();

	try {
		await connection.beginTransaction();

		// use the same connection for transactional queries so commit/rollback affect them
		const [newCardResult] = await connection.execute<ResultSetHeader>(
			QUERY_STRING.ADD_NEW_CARD,
			[card_name, card_balance_init, card_color, bank_code, card_number, userId]
		);

		const insertId = newCardResult.insertId;

		await connection.execute<ResultSetHeader>(
			QUERY_STRING.INIT_TRANSACTION,
			[card_balance_init, "Auto-generated when creating a new card", "in", insertId]
		);

		await connection.commit();

		return insertId;
	} catch (error: unknown) {
		await connection.rollback();
		console.log("Error - createNewCard - Catch: ", error);
		throw new ApiError((error as Error).message || "Error in createNewCard", 500);
	} finally {
		connection.release();
	}
};


export const getCardInfoById = async (cardId: number, userId: string | number): Promise<TCard> => {
	let cardInfo: TCard[] | null = null;

	try {
		cardInfo = (await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CARD_INFO, [cardId])) as TCard[];
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in getCardInfoById", 500);
	}

	if (cardInfo.length === 0) {
		throw new ApiError("Card not found", 404);
	}

	if (cardInfo[0].user_id !== Number(userId)) {
		throw new ApiError("You do not have permission to retrieve this card info", 403);
	}

	return cardInfo[0];
};

export const updateCardInfo = async (
	cardId: number,
	{ bank_code, card_color, card_name, card_number }: TUpdateCard,
	userId: string | number
) => {
	let cardInfo: TCard | null = null;

	try {
		cardInfo = await getCardInfoById(cardId, userId);
	} catch (error: unknown) {
		throw error;
	}

	if (!cardInfo) {
		throw new ApiError("Card not found", 404);
	}

	if (cardInfo.user_id !== Number(userId)) {
		throw new ApiError("You do not have permission to update this card", 403);
	}

	let updateCardStatus: ResultSetHeader | null = null;

	try {
		updateCardStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.UPDATE_CARD_INFO, [
			card_name,
			card_color,
			bank_code,
			card_number,
			cardId,
		]);
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in updateCardInfo", 500);
	}

	if (updateCardStatus.affectedRows === 0) {
		throw new ApiError("Failed to update card", 500);
	}

	return true;
};

export const deleteCard = async (cardId: TCard["card_id"], userId: TUser["user_id"]) => {
	const isOwner = await validateCardOwnership(cardId, userId);

	console.log("🚀 ~ deleteCard ~ isOwner:", isOwner)

	if (isOwner) {
		await dbQuery<ResultSetHeader>(QUERY_STRING.DELETE_CARD, [cardId]);

		return true;
	}

	return false;
};

export const validateCards = async (card_names: string[], user_id: TUser["user_id"]) => {
	const listCards = (await getAllCardsOfUser(user_id)).map(({ card_name }) => card_name);

	const exists_cards: string[] = [];
	const missing_cards: string[] = [];

	card_names.forEach((cardName) => {
		if (listCards.includes(cardName)) {
			exists_cards.push(cardName);
		} else {
			missing_cards.push(cardName);
		}
	});

	return {
		exists_cards,
		missing_cards,
	};
};

const hasCardName = async (card_name: string, user_id: TUser["user_id"]) => {
	try {
		const query = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CARD_INFO_BY_NAME, [card_name, user_id]);

		console.log("query", query);

		return query.length === 0;
	} catch (error: unknown) {
		console.log("error in validateCardName", error);
		throw error;
	}
};

export const createMultipleCards = async (card_names: string[], user_id: TUser["user_id"]) => {
	try {
		let base_query: string = "";
		let base_values: any[] = [];
		let was_created_count: number = 0;
		const creation_logs: {
			card_name: string;
			message: string;
		}[] = [];

		const should_create = await Promise.all(
			card_names.map(async (card) => {
				if (await hasCardName(card, user_id)) {
					return card;
				} else {
					creation_logs.push({
						card_name: card,
						message: "Already exists",
					});

					return null;
				}
			})
		);

		should_create
			.filter((_v) => _v)
			.forEach((card) => {
				base_query += QUERY_STRING.ADD_NEW_CARD;
				base_values.push([card, 0, randomCardColor(), "CASH", user_id]);
				was_created_count++;

				creation_logs.push({
					card_name: card as string,
					message: "New",
				});
			});

		if (base_query) {
			await dbQuery<ResultSetHeader[][]>(base_query, base_values.flat());
		}

		return {
			was_created_count,
			user_cards: await getAllCardsOfUser(user_id),
			creation_logs
		};
	} catch (error: unknown) {
		throw error;
	}
};

export const syncAllCardsBalance = async (userId: TUser["user_id"]) => {
	try {
		const cards = await getAllCardsOfUser(userId);

		if (!cards || cards.length === 0) {
			throw new ApiError("No cards found for user", 404);
		}

		const syncPromises = cards.map(async (card) => {
			updateCardBalance(card.card_id, userId);
		});

		return Promise.all(syncPromises)
	} catch (error: unknown) {
		throw error;
	}
};
