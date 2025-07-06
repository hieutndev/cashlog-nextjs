import { TCard } from "./card";

export type TForecast = {
  forecast_id: string | number;
  forecast_name: string;
  amount: number;
  direction: "in" | "out";
  card_id: TCard["card_id"]
  forecast_date: string;
  repeat_times: number;
  repeat_type: "hour" | "day" | "month" | "year";
  created_at: string;
};

export type TForecastDetail = {
  transaction_id: string | number;
  transaction_amount: number;
  description: string;
  forecast_id: TForecast["forecast_id"]
  transaction_date: string;
};


export type TForecastRowData = {
  date: string;
  old_balance: number;
  new_balance: number;
  direction: "in" | "out";
  amount: number;
  transaction_id: string | number;
}

export type TForecastWithDetailAndCard = TForecast & TForecastDetail & Omit<TCard, "created_at" | "updated_at">;


export type TForecastWithCard = TForecast & TCard;

export type TFetchForecastResult = {
  listForecast: TForecastWithDetailAndCard[];
  groupedResults: {
    forecast_id: string | number;
    details: TForecastWithDetailAndCard[];
  }
}
export type TNewForecast = Omit<TForecast, "forecast_id" | "created_at">

export type TUpdateForecast = TNewForecast;

export type TFetchForecastDetailsResult = {
  details: TForecastWithDetailAndCard;
  transactions: TForecastWithDetailAndCard[];
}
