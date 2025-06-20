
import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { createNewForecast, createNewForecastDetail, getAllForecasts, newForecastSchema } from "./forecast-services";

import { validateRequest } from "@/utils/ajv";

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



    const { isValid, errors } = validateRequest(newForecastSchema, requestBody);

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

