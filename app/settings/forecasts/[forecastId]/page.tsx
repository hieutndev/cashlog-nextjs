import ForecastDetailsWrapper from "@/app/settings/forecasts/[forecastId]/_pages/forecast-details-wrapper";

export default async function ForecastDetailsPage({ params }: { params: Promise<{ forecastId: string }> }) {
	const { forecastId } = await params;

	return <ForecastDetailsWrapper forecastId={forecastId} />;
}
