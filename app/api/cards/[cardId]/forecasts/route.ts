import { handleError } from "@/app/api/_helpers/handle-error";
import { calculateForecast } from "@/app/api/forecasts/forecast-services";


export const GET = async (request: Request, { params }: { params: Promise<{ cardId: string }> }) => {
  try {

    const { cardId } = await params;

    return Response.json({
      status: "success",
      message: "Get all forecasts successfully",
      results: await calculateForecast(cardId)
    });
  } catch (error: unknown) {
    return handleError(error);
  }
};