import { JSONSchemaType } from "ajv";

import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { createNewForecast, createNewForecastDetail, getAllForecasts } from "./forecast-services";

import { validateRequest } from "@/utils/ajv";
import { TNewForecast } from "@/types/forecast";
import { ListTransactionType } from "@/types/transaction";

export const GET = async (request: Request) => {
  try {

    const userId = getFromHeaders(request, "x-user-id", '');

    return Response.json({
      status: "success",
      message: "Get all forecasts successfully",
      results: await getAllForecasts(userId)
    });

  } catch (error: unknown) {
    return handleError(error);
  }
};

export const POST = async (request: Request) => {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const requestBody = await request.json();

    const validateSchema: JSONSchemaType<TNewForecast> = {
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

    const { isValid, errors } = validateRequest(validateSchema, requestBody);

    if (!isValid) {
      return handleValidateError(errors);
    }
    const newForecastId = await createNewForecast(requestBody, userId);

    await createNewForecastDetail(
      newForecastId,
      requestBody
    );

    return Response.json({
      status: "success",
      message: "Create forecast successfully",
      newForecastId: newForecastId
    });

  } catch (error: unknown) {
    return handleError(error);
  }
};

