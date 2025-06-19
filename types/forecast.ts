import { TCard } from "./card";
import { TTransactionType } from "./transaction";

export type TForecast = {
  forecast_id: string | number;
  forecast_name: string;
  amount: number;
  direction: "in" | "out";
  card_id: string | number;
  forecast_date: string;
  repeat_times: number;
  repeat_type: "hour" | "day" | "month" | "year";
  created_at: string;
  transaction_type: TTransactionType;
};

export type TForecastDetail = {
  transaction_id: string | number;
  transaction_amount: number;
  description: string;
  forecast_id: string | number;
  transaction_date: string;
};

export type TFullForecast = TForecast & TForecastDetail & Omit<TCard, "created_at" | "updated_at">;

export type TCardForecast = {
  date: string;
  old_balance: number;
  new_balance: number;
  direction: "in" | "out";
  amount: number;
  transaction_id: string | number;
}

export type TForecastWithCardInfo = TForecast & TCard;

export type TFetchForecastResult = {
  listForecast: TFullForecast[];
  groupedResults: {
    forecast_id: string | number;
    details: TFullForecast[];
  }
}
export type TNewForecast = Omit<TForecast, "forecast_id" | "created_at">

export type TUpdateForecast = TNewForecast;

export type TFetchForecastDetailsResult = {
  details: TForecastWithCardInfo;
  transactions: TFullForecast[];
}
