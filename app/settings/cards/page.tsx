"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import clsx from "clsx";
import { addToast } from "@heroui/toast";
import { Alert } from "@heroui/alert";
import { Spinner } from "@heroui/spinner";

import { useFetch } from "@/hooks/useFetch";
import { TCard } from "@/types/card";
import BankCard from "@/components/shared/bank-card/bank-card";
import { IAPIResponse } from "@/types/global";
import { TBankCode } from "@/types/bank";
import ICONS from "@/configs/icons";

export default function SettingCardsPage() {
	const router = useRouter();

	const [listCards, setListCards] = useState<TCard[]>([]);

	const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

	const {
		data: fetchCardResults,
		loading: loadingCard,
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
		<div className={clsx("w-full flex flex-col gap-8 lg:col-span-10 col-span-12")}>
			{loadingCard ? (
				<div className="flex items-center justify-center">
					<Spinner size={"lg"}>Loading...</Spinner>
				</div>
			) : (
				<div className="flex flex-col gap-4">
					<div className={"flex items-center justify-between"}>
						<h3 className={"text-2xl font-semibold"}>List Cards</h3>
						<Button
							color={"primary"}
							startContent={ICONS.NEW.MD}
							onPress={() => router.push("/settings/cards/new")}
						>
							New Card
						</Button>
					</div>
					<div className={"flex flex-wrap gap-4 w-full"}>
						{listCards && listCards.length > 0 ? (
							listCards.map((card) => (
								<div
									key={card.card_id}
									className={clsx(
										"relative overflow-hidden group rounded-3xl sm:w-96 md:w-88 lg:w-92 w-full",
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
							))
						) : (
							<Alert
								color={"danger"}
								title={"No cards found. Please add a card."}
							/>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
