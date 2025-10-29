"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import CardForm from "@/components/cards/card-form";
import ICONS from "@/configs/icons";

interface EditCardProps {
	params: Promise<{ cardId: string }>;
}

export default function EditCardPage({ params }: EditCardProps) {
	const router = useRouter();

	// Handle params as a promise
	const cardIdPromise = params.then((p) => p.cardId);

	const handleSuccess = () => {
		router.push("/settings/cards");
	};

	return (
		<div className={"flex flex-col gap-4 col-span-12 lg:col-span-10"}>
			<div className={"flex items-center justify-between"}>
				<h3 className={"text-2xl font-semibold"}>Update Card</h3>
				<Button
					color={"primary"}
					startContent={ICONS.BACK.MD}
					onPress={() => router.push("/settings/cards")}
				>
					Back
				</Button>
			</div>
			<CardFormWrapper cardIdPromise={cardIdPromise} onSuccess={handleSuccess} />
		</div>
	);
}

interface CardFormWrapperProps {
	cardIdPromise: Promise<string>;
	onSuccess: () => void;
}

function CardFormWrapper({ cardIdPromise, onSuccess }: CardFormWrapperProps) {
	const [cardId, setCardId] = React.useState<string | null>(null);

	React.useEffect(() => {
		cardIdPromise.then(setCardId);
	}, [cardIdPromise]);

	if (!cardId) {
		return null;
	}

	return <CardForm mode="edit" cardId={cardId} onSuccess={onSuccess} />;
}
