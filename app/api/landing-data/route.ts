import { handleError } from '../_helpers/handle-error';
import { getLandingDataStats } from '../_services/landing-data-services';

export const runtime = 'nodejs';

export async function GET() {
    try {

        return Response.json({
            status: "success",
            message: "Landing data statistics retrieved successfully",
            results: await getLandingDataStats()
        });
    } catch (error: unknown) {
        return handleError(error);
    }
}
