import { TCategory } from "./category";

import { TCard } from "@/types/card";

export type Transaction = {
  transactionId: string;
  cardId: string;
  transactionReason: string;
  transactionType: "income" | "outcome";
  transactionAmount: number;
  transactionDescription: string;
  transactionDate: string;
  transactionCategory: string | null;
};

export type NewTransaction = Omit<Transaction, "transactionId">;

export const ListTransactionType: TTransactionType[] = [
  "receive",
  "borrow",
  "repay_received",
  "spend",
  "lend",
  "repay_sent",
  "init"
];

export type TTransactionType =
  | "receive"
  | "spend"
  | "lend"
  | "repay_received"
  | "borrow"
  | "repay_sent"
  | "init";

export type TTransaction = {
  transaction_id: string;
  card_id: string | number;
  direction: "in" | "out";
  transaction_category: number;
  transaction_date: string;
};

export type TTransactionDetail = {
  transaction_id: string | number;
  transaction_type: TTransactionType;
  transaction_amount: number;
  description: string;
  created_at: string;
};

export type TFullTransaction = TTransaction &
  TTransactionDetail & {
    transaction_category: TCategory;
  } & TCard;

export type TNewTransaction = Omit<
  TTransaction & TTransactionDetail,
  "transaction_id" | "created_at" | "transaction_category"
> & {
  transaction_category: number;
};
