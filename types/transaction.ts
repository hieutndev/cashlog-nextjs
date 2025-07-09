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

export type TCrudTransaction = Omit<TTransaction, "transaction_id" | "created_at" | "date">
    & Pick<TCard, "card_id">
    & {
        date: string;
    };
