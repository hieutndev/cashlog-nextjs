import { ResultSetHeader, RowDataPacket } from "mysql2";
import { JSONSchemaType } from "ajv";

import { TCard, TEditCard, TNewCard } from "@/types/card";
import { dbQuery } from "@/libs/mysql";
import { QUERY_STRING } from "@/configs/query-string";
import { TCrudTransaction } from "@/types/transaction";
import { ApiError } from "@/types/api-error";
import { ListColors } from "@/types/global";
import { TUser } from "@/types/user";


export const getCardInfoSchema: JSONSchemaType<{ cardId: string }> = {
    type: "object",
    properties: {
        cardId: { type: "string", minLength: 1, pattern: "^[0-9]+$" }
    },
    required: ["cardId"],
    additionalProperties: false
};

export const newCardSchema: JSONSchemaType<TNewCard> = {
    type: "object",
    properties: {
        card_name: { type: "string", minLength: 3 },
        card_balance_init: { type: "integer", minimum: 0 },
        card_color: {
            type: "string",
            enum: ListColors
        },
        bank_code: { type: "string" }
    },
    required: ["card_name", "card_balance_init", "card_color", "bank_code"],
    additionalProperties: false
};

export const editCardSchema: JSONSchemaType<TEditCard & { cardId: string }> = {
    type: "object",
    properties: {
        cardId: { type: "string", minLength: 1, pattern: "^[0-9]+$" },
        card_name: { type: "string", minLength: 3 },
        card_color: {
            type: "string",
            enum: ListColors
        },
        bank_code: { type: "string" }
    },
    required: ["cardId", "card_name", "card_color", "bank_code"],
    additionalProperties: false
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
}

export const createNewCard = async ({
    card_name,
    bank_code,
    card_balance_init,
    card_color
}: TNewCard, userId: string | number) => {
    let newCard: ResultSetHeader | null = null;

    try {
        newCard = await dbQuery<ResultSetHeader>(QUERY_STRING.CREATE_NEW_CARD, [
            card_name,
            card_balance_init,
            card_color,
            bank_code,
            userId
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
            amount: card_balance_init
        });
    } catch (error: unknown) {
        await deleteCard(newCard.insertId, userId);
        throw error;
    }

    return newCard.insertId;
};

export const makeInitTransaction = async ({
    card_id,
    amount
}: Pick<TCrudTransaction, "card_id" | "amount">) => {
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
        cardInfo = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CARD_INFO, [cardId]) as TCard[];
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
    { bank_code, card_color, card_name }: TEditCard,
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
        updateCardStatus = await dbQuery<ResultSetHeader>(
            QUERY_STRING.UPDATE_CARD_INFO,
            [card_name, card_color, bank_code, cardId]
        );
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