import { JSONSchemaType } from "ajv";

import {
  createNewForecastDetail,
  deleteCurrentForecastTransaction,
  deleteForecast,
  getForecastById,
  getForecastTransactions,
  updateForecast,
  validateForecastOwnership
} from "../forecast-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { ListTransactionType } from "@/types/transaction";
import { validateRequest } from "@/utils/ajv";
import { TUpdateForecast } from "@/types/forecast";
import { ApiError } from "@/types/api-error";


interface ForecastDetailRouteProps { params: Promise<{ forecastId: string }> }

export const GET = async (request: Request, { params }: ForecastDetailRouteProps) => {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const { forecastId } = await params;

    if (isNaN(Number(forecastId))) {
      return handleError(new ApiError("Invalid forecast ID", 404));
    }

    // Validate forecast ownership
    await validateForecastOwnership(forecastId, userId);

    const [forecastDetails, forecastTransactions] = await Promise.all([
      getForecastById(forecastId),
      getForecastTransactions(forecastId)
    ]);

    return Response.json({
      status: "success",
      message: "Get forecast successfully",
      results: {
        details: forecastDetails,
        transactions: forecastTransactions
      }
    });
  } catch (error: unknown) {
    return handleError(error);
  }
}

export const PUT = async (request: Request, { params }: ForecastDetailRouteProps) => {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const { forecastId } = await params;

    if (isNaN(Number(forecastId))) {
      return handleError(new ApiError("Invalid forecast ID", 404));
    }

    // Validate forecast ownership
    await validateForecastOwnership(forecastId, userId);

    const requestBody = await request.json();

    const validateSchema: JSONSchemaType<TUpdateForecast> = {
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

    const { isValid, errors } = validateRequest(validateSchema, requestBody);

    if (!isValid) {
      return handleValidateError(errors);
    }

    await deleteCurrentForecastTransaction(forecastId);

    await Promise.all([
      updateForecast(forecastId, requestBody),
      createNewForecastDetail(forecastId, requestBody)
    ]);

    return Response.json({
      status: "success",
      message: "Update forecast successfully"
    });

  } catch (error: unknown) {
    return handleError(error);
  }
};

export const DELETE = async (request: Request, { params }: ForecastDetailRouteProps) => {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const { forecastId } = await params;

    if (isNaN(Number(forecastId))) {
      return handleError(new ApiError("Invalid forecast ID", 404));
    }

    // Validate forecast ownership
    await validateForecastOwnership(forecastId, userId);

    if (await deleteForecast(forecastId)) {
      return Response.json({
        status: "success",
        message: "Delete forecast successfully"
      });
    }
  } catch (error: unknown) {
    return handleError(error);
  }
};