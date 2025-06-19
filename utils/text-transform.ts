import moment from "moment";

import { TNewForecast } from "@/types/forecast";

export const upperFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

export const cutString = (string: string, length: number) => {
  if (string.length > length) {
    return string.slice(0, length) + "...";
  }

  return string;
};

export const formatMYSQLDate = (date: string) => {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
};

export const makeListDate = (
  forecast_date: Date,
  repeat_times: number,
  repeat_type: TNewForecast["repeat_type"]
) => {

  const dateList: Date[] = [];
  let currentDate = new Date(forecast_date);

  for (let i = 0; i < repeat_times; i++) {
    dateList.push(new Date(currentDate));
    switch (repeat_type) {
      case "hour":
        currentDate.setHours(currentDate.getHours() + 1);
        break;
      case "day":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "month":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case "year":
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
  }

  return dateList;
};