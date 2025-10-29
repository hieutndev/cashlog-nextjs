import { TUser } from "./user";

import { TColor } from "@/types/global";
import { TBankCode } from "@/types/bank";

export type TCard = {
  card_id: number;
  card_name: string;
  card_balance: number;
  card_number: string;
  bank_code: TBankCode;
  card_color: TColor;
  user_id: TUser['user_id'];
  created_at: string;
  updated_at: string;
};

export type TAddNewCard = Omit<TCard, "card_id" | "created_at" | "updated_at" | "user_id">;

export type TUpdateCard = TAddNewCard;
