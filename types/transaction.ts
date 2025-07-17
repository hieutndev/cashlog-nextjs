import { TCategory } from "./category";

import { TCard } from "@/types/card";

export type TTransaction = {
	transaction_id: string;
	direction: "in" | "out";
	amount: number;
	date: string;
	description: string;
	card_id: TCard["card_id"];
	category_id: TCategory["category_id"] | null;
	created_at: string;
};

export type TTransactionWithCard = TTransaction & TCard;

export type TTransactionWithCardAndCategory = TTransaction & TCard & TCategory;

export type TCrudTransaction = Omit<TTransaction, "transaction_id" | "created_at" | "date"> &
	Pick<TCard, "card_id"> & {
		date: string;
	};

export type TImportFileXLSXResponse = {
	headers: string[];
	mapped_column_data: {
		direction: ("in" | "out")[];
		date: string[];
		amount: number[];
		description: string[];
		category_name: string[];
		card_name: string[];
	};
	set_data: {
		set_categories: string[];
		set_cards: string[];
	};
};

export type TValidateCategoriesResponse = {
	missing_categories: string[];
	exists_categories: string[];
};

export type TValidateCardsResponse = {
	missing_cards: string[];
	exists_cards: string[];
};

export type TCreateMultipleTransactionsResponse = {
	success_count: number;
	error_count: number;
	errors: {
		transaction: TCrudTransaction;
		error: string;
	}[];
};

export const REQUIRED_HEADERS = ["date", "direction", "description", "amount", "category_name", "card_name"];
