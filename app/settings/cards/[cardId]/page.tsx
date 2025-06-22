import EditCardForm from "./_component/edit-form";

interface EditCardProps {
	params: Promise<{ cardId: string }>;
}

export default async function EditCardPage({ params }: EditCardProps) {
	const { cardId } = await params;

	return (
		<>
			<EditCardForm cardId={cardId} />
		</>
	);
}
