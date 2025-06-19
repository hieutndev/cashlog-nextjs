"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import clsx from "clsx";
import { addToast } from "@heroui/toast";

import { useFetch } from "@/hooks/useFetch";
import { TCard } from "@/types/card";
import BankCard from "@/components/shared/bank-card/bank-card";
import { IAPIResponse } from "@/types/global";
import { TBankCode } from "@/types/bank";

export default function SettingCardsPage() {
	const router = useRouter();

	const [listCards, setListCards] = useState<TCard[]>([]);

	const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

	const {
		data: fetchCardResults,
		// loading: loadingCard,
		// error: errorFetchCard,
		fetch: fetchCard,
	} = useFetch<IAPIResponse<TCard[]>>("/cards");

	const {
		data: deleteCardResults,
		// loading: deletingCard,
		error: errorDeleteCard,
		fetch: deleteCard,
	} = useFetch<IAPIResponse>(
		"/cards",
		{ cardId: selectedCardId },
		{
			method: "DELETE",
			skip: true,
		}
	);

	useEffect(() => {
		if (selectedCardId) {
			deleteCard();
		}
	}, [selectedCardId]);

	useEffect(() => {
		if (deleteCardResults) {
			addToast({
				title: "Success",
				description: deleteCardResults.message,
				color: "success",
			});
			fetchCard();
			setSelectedCardId(null);
		}

		if (errorDeleteCard) {
			addToast({
				title: "Error",
				description: JSON.parse(errorDeleteCard).message,
				color: "danger",
			});
		}
	}, [deleteCardResults, errorDeleteCard]);

	useEffect(() => {
		if (fetchCardResults) {
			setListCards(fetchCardResults?.results || []);
		}
	}, [fetchCardResults]);

	return (
		<div className={"w-full flex flex-col gap-8"}>
			<div className={"flex flex-wrap gap-4"}>
				{listCards &&
					listCards.map((card) => (
						<div
							key={card.card_id}
							className={clsx(
								"relative overflow-hidden group rounded-3xl",
								`bankcard-shadow-${card.card_color}`
							)}
						>
							<BankCard
								key={card.card_id}
								bankCode={card.bank_code as TBankCode}
								cardBalance={card.card_balance}
								cardName={card.card_name}
								color={card.card_color}
							/>
							<div
								className={clsx(
									"absolute rounded-xl flex items-center justify-center gap-4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/90",
									"transition-all duration-300 ease-in-out -top-96 group-hover:top-1/2"
								)}
							>
								<Button
									color={"primary"}
									variant={"solid"}
									onPress={() => router.push(`/settings/cards/${card.card_id}`)}
								>
									View Details
								</Button>
								<Button
									color={"danger"}
									variant={"ghost"}
									onPress={() => setSelectedCardId(card.card_id.toString())}
								>
									Delete
								</Button>
							</div>
						</div>
					))}
			</div>
		</div>
	);
}
