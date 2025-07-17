import { ResultSetHeader, RowDataPacket } from "mysql2";
import { JSONSchemaType } from "ajv";

import { TCard, TUpdateCard, TCreateNewCard } from "@/types/card";
import { dbQuery } from "@/libs/mysql";
import { QUERY_STRING } from "@/configs/query-string";
import { TCrudTransaction } from "@/types/transaction";
import { ApiError } from "@/types/api-error";
import { ListColors } from "@/types/global";
import { TUser } from "@/types/user";
import { randomCardColor } from "@/utils/random-color";

export const getCardInfoSchema: JSONSchemaType<{ cardId: string }> = {
	type: "object",
	properties: {
		cardId: { type: "string", minLength: 1, pattern: "^[0-9]+$" },
	},
	required: ["cardId"],
	additionalProperties: false,
};

export const newCardSchema: JSONSchemaType<TCreateNewCard> = {
	type: "object",
	properties: {
		card_name: { type: "string", minLength: 3 },
		card_balance_init: { type: "integer", minimum: 0 },
		card_color: {
			type: "string",
			enum: ListColors,
		},
		bank_code: { type: "string" },
	},
	required: ["card_name", "card_balance_init", "card_color", "bank_code"],
	additionalProperties: false,
};

export const createMultiCardsSchema: JSONSchemaType<{ card_names: string[] }> = {
	type: "object",
	properties: {
		card_names: {
			type: "array",
			items: { type: "string", minLength: 1 },
			minItems: 1,
		},
	},
	required: ["card_names"],
	additionalProperties: false,
};

export const editCardSchema: JSONSchemaType<TUpdateCard & { cardId: string }> = {
	type: "object",
	properties: {
		cardId: { type: "string", minLength: 1, pattern: "^[0-9]+$" },
		card_name: { type: "string", minLength: 3 },
		card_color: {
			type: "string",
			enum: ListColors,
		},
		bank_code: { type: "string" },
	},
	required: ["cardId", "card_name", "card_color", "bank_code"],
	additionalProperties: false,
};

export const validateCardOwnership = async (cardId: TCard["card_id"], userId: TUser["user_id"]) => {
	let cardInfo: RowDataPacket[] | null = null;

	try {
		cardInfo = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CARD_INFO, [cardId]);
	} catch (error: unknown) {
		console.log("error in validateCardOwnership", error);
		throw new ApiError("Error validating card ownership", 500);
	}

	if (!cardInfo || cardInfo.length === 0) {
		throw new ApiError("Card not found", 404);
	}

	if (cardInfo[0].user_id !== Number(userId)) {
		throw new ApiError("You do not have permission to access this card", 403);
	}

	return true;
};

export const getAllCardsOfUser = async (userId: string | number) => {
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

export const createNewCard = async (
	{ card_name, bank_code, card_balance_init, card_color }: TCreateNewCard,
	userId: string | number
) => {
	let newCard: ResultSetHeader | null = null;

	try {
		newCard = await dbQuery<ResultSetHeader>(QUERY_STRING.CREATE_NEW_CARD, [
			card_name,
			card_balance_init,
			card_color,
			bank_code,
			userId,
		]);
	} catch (error) {
		throw new ApiError((error as Error).message || "Error in createNewCard", 500);
	}

	if (newCard.affectedRows === 0) {
		throw new ApiError("Failed to create new card", 500);
	}

	try {
		await makeInitTransaction({
			card_id: newCard.insertId,
			amount: card_balance_init,
		});
	} catch (error: unknown) {
		await deleteCard(newCard.insertId, userId);
		throw error;
	}

	return newCard.insertId;
};

export const makeInitTransaction = async ({ card_id, amount }: Pick<TCrudTransaction, "card_id" | "amount">) => {
	try {
		return await dbQuery<ResultSetHeader>(QUERY_STRING.INIT_TRANSACTION, [amount, "Init balance", "in", card_id]);
	} catch (error) {
		console.log("error in makeInitTransaction", error);
		throw new ApiError("Error in makeInitTransaction", 500);
	}
};

export const getCardInfoById = async (cardId: number, userId: string | number): Promise<TCard | null> => {
	let cardInfo: TCard[] | null = null;

	try {
		cardInfo = (await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CARD_INFO, [cardId])) as TCard[];
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in getCardInfoById", 500);
	}

	if (cardInfo.length === 0) {
		return null;
	}

	if (cardInfo[0].user_id !== Number(userId)) {
		throw new ApiError("You do not have permission to retrieve this card info", 403);
	}

	return cardInfo[0];
};

export const updateCardInfo = async (
	cardId: number,
	{ bank_code, card_color, card_name }: TUpdateCard,
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

export const deleteCard = async (cardId: number, userId: string | number) => {
	let deleteStatus: ResultSetHeader | null = null;

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
		throw new ApiError("You do not have permission to delete this card", 403);
	}

	try {
		deleteStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.DELETE_CARD, [cardId]);
	} catch (error: unknown) {
		throw new ApiError((error as Error).message || "Error in deleteCard", 500);
	}

	if (deleteStatus.affectedRows === 0) {
		throw new ApiError("Failed to delete card", 500);
	}

	return true;
};

export const validateCards = async (card_names: string[], user_id: TUser["user_id"]) => {
	try {
		console.log(user_id);

		const list_cards_of_user = (await getAllCardsOfUser(user_id)).map(({ card_name }) => card_name);

		const exists_cards: string[] = [];
		const missing_cards: string[] = [];

		card_names.forEach((cardName) => {
			if (list_cards_of_user.includes(cardName)) {
				exists_cards.push(cardName);
			} else {
				missing_cards.push(cardName);
			}
		});

		return {
			exists_cards,
			missing_cards,
		};
	} catch (error: unknown) {
		throw error;
	}
};

const validateCardName = async (card_name: string, user_id: TUser["user_id"]) => {
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
		let baseQuery: string = "";
		let baseValues: any[] = [];
		let createdNew: number = 0;

		const willCreate = await Promise.all(
			card_names.map(async (card) => {
				if (await validateCardName(card, user_id)) {
					return card;
				}
			})
		);

		willCreate
			.filter((_v) => _v)
			.forEach((card) => {
				baseQuery += QUERY_STRING.CREATE_NEW_CARD;
				baseValues.push([card, 0, randomCardColor(), "CASH", user_id]);
				createdNew++;
			});

		if (baseQuery) {
			await dbQuery<ResultSetHeader[][]>(baseQuery, baseValues.flat());
		}

		return {
			created_new: createdNew,
			user_cards: await getAllCardsOfUser(user_id),
		};
	} catch (error: unknown) {
		throw error;
	}
};
