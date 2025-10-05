import RecurringDetailsWrapper from "./_pages/recurring-details-wrapper";

export default async function RecurringDetailsPage({ params }: { params: Promise<{ recurringId: string }> }) {
	const { recurringId } = await params;

	return <RecurringDetailsWrapper recurringId={recurringId} />;
}
