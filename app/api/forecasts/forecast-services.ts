import { ResultSetHeader, RowDataPacket } from "mysql2";
import { JSONSchemaType } from "ajv";

import { QUERY_STRING } from "@/config/query-string";
import { dbQuery } from "@/libs/mysql";
import { TFullForecast, TNewForecast, TUpdateForecast } from "@/types/forecast";
import { formatMYSQLDate, makeListDate } from "@/utils/text-transform";
import { ApiError } from "@/types/api-error";
import { validateCardOwnership } from "@/app/api/cards/card-services";
import { ListTransactionType } from "@/types/transaction";


export const newForecastSchema: JSONSchemaType<TNewForecast> = {
  type: "object",
  properties: {
    forecast_name: { type: "string", minLength: 1 },
    amount: { type: "integer", minimum: 0 },
    direction: { type: "string", enum: ["in", "out"] },
    card_id: { type: "integer", minimum: 1 },
    forecast_date: {
      anyOf: [
        { type: "string", format: "date" },
        { type: "string", format: "date-time" }
      ]
    },
    repeat_times: { type: "number", minimum: 1 },
    repeat_type: { type: "string", enum: ["day", "hour", "month", "year"] },
    transaction_type: { type: "string", enum: ListTransactionType }
  },
  required: [
    "forecast_name",
    "amount",
    "direction",
    "card_id",
    "forecast_date",
    "repeat_times",
    "repeat_type"
  ],
  additionalProperties: false
};


export const updateForecastSchema: JSONSchemaType<TUpdateForecast> = {
  type: "object",
  properties: {
    forecast_name: { type: "string", minLength: 1 },
    amount: { type: "integer", minimum: 1000 },
    direction: { type: "string", enum: ["in", "out"] },
    card_id: { type: "integer", minimum: 1 },
    forecast_date: {
      anyOf: [
        { type: "string", format: "date" },
        { type: "string", format: "date-time" }
      ]
    },
    repeat_times: { type: "number", minimum: 1 },
    repeat_type: { type: "string", enum: ["day", "hour", "month", "year"] },
    transaction_type: { type: "string", enum: ListTransactionType }
  },
  required: [
    "forecast_name",
    "amount",
    "direction",
    "card_id",
    "forecast_date",
    "repeat_times",
    "repeat_type"
  ],
  additionalProperties: false
};

export const validateForecastOwnership = async (forecastId: string | number, userId: string | number) => {
  try {
    const forecastInfo = await getForecastById(forecastId);

    if (!forecastInfo) {
      throw new ApiError("Forecast not found", 404);
    }

    // Validate that the card associated with this forecast belongs to the user
    await validateCardOwnership(forecastInfo.card_id, userId);

    return true;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError((error as Error).message || "Error validating forecast ownership", 500);
  }
};

export const getAllForecasts = async (userId: string) => {
  try {
    return await dbQuery<RowDataPacket[]>(
      userId ? QUERY_STRING.GET_ALL_FORECASTS_OF_USER : QUERY_STRING.GET_ALL_FORECASTS,
      [userId]
    );
  } catch (error: unknown) {
    console.log("🚀 ~ getAllForecasts ~ error:", error)

    throw new ApiError((error as Error).message || "Error in getAllForecasts", 500);
  }

};

export const getForecastTransactions = async (forecastId: string) => {
  try {
    return await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_FULL_FORECAST_DETAILS_BY_FORECAST_ID, [forecastId])
  } catch (error) {
    throw new ApiError((error as Error).message || "Error in getForecastTransactions", 500);
  }
};

export const getForecastTransactionsByCardId = async (cardId: string) => {
  try {
    return await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_FULL_FORECAST_DETAILS_BY_CARD_ID, [cardId]);;
  } catch (error) {
    throw new ApiError((error as Error).message || "Error in getForecastTransactionsByCardId", 500);
  }
};

export const getForecastById = async (forecastId: string | number) => {

  try {
    const forecastInfo = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_FORECAST_BY_ID, [forecastId]);

    if (forecastInfo.length === 0) {
      return false;
    }

    return forecastInfo[0] as TFullForecast;
  } catch (error: any) {
    throw new ApiError((error as Error).message || "Error in getForecastById", 500);
  }
};

export const createNewForecast = async ({
  forecast_name,
  amount,
  direction,
  card_id,
  forecast_date,
  repeat_times,
  repeat_type,
  transaction_type
}: TNewForecast, userId?: string | number) => {

  // Validate card ownership if userId is provided
  if (userId) {
    await validateCardOwnership(card_id, userId);
  }

  let createStatus: ResultSetHeader | null = null;

  try {
    createStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.CREATE_NEW_FORECAST, [
      forecast_name,
      amount,
      direction,
      card_id,
      formatMYSQLDate(forecast_date),
      repeat_times,
      repeat_type,
      transaction_type
    ]);
  }
  catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in createNewForecast", 500);
  }

  if (!createStatus || createStatus.affectedRows === 0) {
    throw new ApiError("Failed to create new forecast", 500);
  }

  return createStatus.insertId;

};

export const createNewForecastDetail = async (
  forecastId: string | number,
  { forecast_name, amount, forecast_date, repeat_times, repeat_type }: TNewForecast
) => {
  const forecastDate = new Date(forecast_date);
  const listDate = makeListDate(forecastDate, repeat_times, repeat_type);

  const makeQueryString = Array.from(
    { length: repeat_times },
    () => QUERY_STRING.CREATE_NEW_FORECAST_DETAIL
  ).join("");

  const makeQueryParams = Array.from({ length: repeat_times }, (_, i) => [
    amount,
    `Forecast ${forecast_name} #${i + 1}`,
    forecastId,
    formatMYSQLDate(listDate[i].toISOString())
  ]).flat();


  let createForecastDetailsStatus: ResultSetHeader[] | ResultSetHeader | null = null;

  try {
    createForecastDetailsStatus = await dbQuery<ResultSetHeader[] | ResultSetHeader>(
      makeQueryString,
      makeQueryParams
    );
  } catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in createNewForecastDetail", 500);
  }

  if (
    Array.isArray(createForecastDetailsStatus) &&
    createForecastDetailsStatus.find((_v) => _v.affectedRows === 0)
  ) {
    throw new ApiError("Some forecast details failed to create", 500);
  } else if (!Array.isArray(createForecastDetailsStatus) && createForecastDetailsStatus.affectedRows === 0) {
    throw new ApiError("Create forecast detail failed", 500);
  }

  return true;
};

export const calculateForecast = async (cardId: string) => {
  try {
    const listForecastOfCard = (await getForecastTransactionsByCardId(cardId)) as TFullForecast[];

    let currentCardBalance = listForecastOfCard[0] ? Number(listForecastOfCard[0].card_balance) : 0;

    const validForecasts = listForecastOfCard.filter((f) => {
      const transaction_date = new Date(f.transaction_date).setHours(0, 0, 0, 0);
      const currentDate = new Date().setHours(0, 0, 0, 0);

      return transaction_date >= currentDate;
    });

    validForecasts.sort((a, b) => {
      const forecastDateA = new Date(a.transaction_date);
      const forecastDateB = new Date(b.transaction_date);

      return forecastDateA.getTime() - forecastDateB.getTime();
    });

    // Calculate the forecast balance by direction in out, then return and object that contains the date and old and new balance
    return validForecasts.map((f) => {
      const forecastDate = new Date(f.transaction_date);
      const forecastAmount = Number(f.amount);
      const forecastDirection = f.direction;
      const oldBalance = currentCardBalance;

      if (forecastDirection === "in") {
        currentCardBalance += forecastAmount;
      } else {
        currentCardBalance -= forecastAmount;
      }

      return {
        date: formatMYSQLDate(forecastDate.toISOString()),
        old_balance: oldBalance,
        new_balance: currentCardBalance,
        direction: forecastDirection,
        amount: forecastAmount,
        transaction_id: f.transaction_id,
        forecast_name: f.forecast_name
      };
    });

  } catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in calculateForecast", 500);
  }
};

export const deleteForecast = async (forecastId: string | number) => {

  const validForecastId = await getForecastById(forecastId);

  if (!validForecastId) {
    throw new ApiError("Invalid forecast ID", 400);
  }

  let deleteForecastStatus: ResultSetHeader[] | null = null;

  try {
    deleteForecastStatus = await dbQuery<ResultSetHeader[]>(QUERY_STRING.DELETE_FORECAST, [
      forecastId,
      forecastId
    ]);
  } catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in deleteForecast", 500);
  }

  if (deleteForecastStatus.find((_v) => _v.affectedRows === 0)) {
    throw new ApiError("Delete forecast failed", 500);
  }

  return true;

}

export const updateForecast = async (
  forecastId: string | number,
  {
    forecast_name,
    amount,
    direction,
    card_id,
    forecast_date,
    repeat_times,
    repeat_type,
    transaction_type
  }: TUpdateForecast
) => {


  const validForecastId = await getForecastById(forecastId);

  if (!validForecastId) {
    throw new ApiError("Invalid forecast ID", 400);
  }

  let updateForecastStatus: ResultSetHeader | null = null;

  try {
    updateForecastStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.UPDATE_FORECAST, [
      forecast_name,
      amount,
      direction,
      card_id,
      formatMYSQLDate(forecast_date),
      repeat_times,
      repeat_type,
      transaction_type,
      forecastId
    ]);
  } catch (error: unknown) {
    throw new ApiError((error as Error).message || "Error in updateForecast", 500);
  }

  if (updateForecastStatus.affectedRows === 0) {
    throw new ApiError("Update forecast failed", 500);
  }

  return true;
};

export const deleteCurrentForecastTransaction = async (forecastId: string | number) => {

  const validForecastId = await getForecastById(forecastId);

  if (!validForecastId) {
    throw new ApiError("Invalid forecast ID", 400);
  }

  let deleteForecastDetailStatus: ResultSetHeader | null = null;

  try {
    deleteForecastDetailStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.DELETE_FORECAST_TRANSACTION, [
      forecastId
    ]);
  } catch (error: unknown) {
    console.log("deleteCurrentForecastTransaction - Delete forecast transaction error: ", error);
    throw new ApiError((error as Error).message || "Delete forecast transaction failed", 500);
  }

  if (deleteForecastDetailStatus.affectedRows === 0) {
    throw new ApiError("Delete forecast transaction failed", 500);
  }

  return true;

};