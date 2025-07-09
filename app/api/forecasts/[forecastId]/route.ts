
import {
  createNewForecastDetail,
  deleteCurrentForecastTransaction,
  deleteForecast,
  getForecastById,
  getForecastTransactions,
  updateForecast,
  updateForecastSchema,
  validateForecastOwnership
} from "../forecast-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { validateRequest } from "@/utils/ajv";
import { ApiError } from "@/types/api-error";


interface ForecastDetailRouteProps { params: Promise<{ forecastId: string }> }

export const GET = async (request: Request, { params }: ForecastDetailRouteProps) => {
  try {
    const userId = getFromHeaders<number>(request, "x-user-id", -1);
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
    const userId = getFromHeaders<number>(request, "x-user-id", -1);
    const { forecastId } = await params;

    if (isNaN(Number(forecastId))) {
      return handleError(new ApiError("Invalid forecast ID", 404));
    }

    // Validate forecast ownership
    await validateForecastOwnership(forecastId, userId);

    const requestBody = await request.json();



    const { isValid, errors } = validateRequest(updateForecastSchema, requestBody);

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
    const userId = getFromHeaders<number>(request, "x-user-id", -1);
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