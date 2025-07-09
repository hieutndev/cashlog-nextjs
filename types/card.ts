import { TColor } from "@/types/global";
import { TBankCode } from "@/types/bank";

export type TCard = {
  card_id: number;
  card_name: string;
  card_balance: number;
  bank_code: TBankCode;
  card_color: TColor;
  user_id: number;
  created_at: string;
  updated_at: string;
};

export type TNewCard = Omit<TCard, "card_id" | "card_balance" | "created_at" | "updated_at" | "user_id"> & {
  card_balance_init: number;
};

export type TEditCard = Omit<TCard, "card_id" | "card_balance" | "created_at" | "updated_at" | "user_id">;
