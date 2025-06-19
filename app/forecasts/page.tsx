"use client";

import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { RadioGroup } from "@heroui/radio";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import clsx from "clsx";
import moment from "moment";

import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import { TCard } from "@/types/card";
import BankCardRadio from "@/components/shared/bank-card-radio/bank-card-radio";
import { TCardForecast } from "@/types/forecast";

export default function ForecastsPage() {
	const {
		data: fetchCardResults,
		error: fetchCardError,
		// loading: fetchCardLoading,
	} = useFetch<IAPIResponse<TCard[]>>("/cards");

	const [listCards, setListCards] = useState<TCard[]>([]);
	const [selectedCard, setSelectedCard] = useState<number | null>(null);
	const [listForecasts, setListForecasts] = useState<TCardForecast[]>([]);

	useEffect(() => {
		if (fetchCardResults) {
			setListCards(fetchCardResults.results ?? []);
			setSelectedCard(
				fetchCardResults?.results?.[0]?.card_id ? Number(fetchCardResults.results[0].card_id) : null
			);
		}

		if (fetchCardError) {
			addToast({
				title: "Error",
				description: JSON.parse(fetchCardError).message,
				color: "danger",
			});
		}
	}, [fetchCardResults, fetchCardError]);

	const {
		data: fetchForecastResults,
		error: fetchForecastError,
		// loading: fetchForecastLoading,
		fetch: fetchForecast,
	} = useFetch<IAPIResponse<TCardForecast[]>>(`/cards/${selectedCard}/forecasts`, {
		skip: true,
	});

	useEffect(() => {
		if (fetchForecastResults) {
			setListForecasts(fetchForecastResults?.results ?? []);
		}

		if (fetchForecastError) {
			addToast({
				title: "Error",
				description: JSON.parse(fetchForecastError).message,
				color: "danger",
			});
		}
	}, [fetchForecastResults, fetchForecastError]);

	useEffect(() => {
		if (selectedCard) {
			fetchForecast();
		}
	}, [selectedCard]);

	const forecastColumns = [
		{
			key: "date",
			label: "Date",
		},
		{
			key: "forecast_name",
			label: "Forecast Name",
		},
		{
			key: "old_balance",
			label: "Old Balance",
		},

		{
			key: "amount",
			label: "Amount",
		},
		{
			key: "new_balance",
			label: "New Balance",
		},
	];

	return (
		<section className={"flex flex-col gap-4"}>
			<div className={"flex items-center gap-4"}>
				<RadioGroup
					label={"Select card"}
					orientation="horizontal"
					value={selectedCard?.toString()}
					onValueChange={(value) => setSelectedCard(Number(value))}
				>
					{listCards.map((card) => (
						<BankCardRadio
							key={card.card_id}
							bank_code={card.bank_code}
							card_balance={card.card_balance}
							card_id={card.card_id}
							card_name={card.card_name}
						/>
					))}
				</RadioGroup>
			</div>
			<Table>
				<TableHeader columns={forecastColumns}>
					{(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
				</TableHeader>
				<TableBody
					emptyContent={"Empty forecasts"}
					items={listForecasts}
				>
					{(item) => (
						<TableRow
							key={item.transaction_id}
							className={clsx({
								"text-success": item.direction === "in",
								"text-danger": item.direction === "out",
							})}
						>
							{(columnKey) => {
								switch (columnKey) {
									case "old_balance":
									case "new_balance":
										return (
											<TableCell>
												{Number(getKeyValue(item, columnKey)).toLocaleString()}
											</TableCell>
										);
									case "date":
										return (
											<TableCell>
												{moment(getKeyValue(item, columnKey)).format("DD-MM-YYYY")}
											</TableCell>
										);
									case "amount":
										return (
											<TableCell>
												{item.direction === "in" ? "+" : "-"}
												{Number(getKeyValue(item, columnKey)).toLocaleString()}
											</TableCell>
										);
									default:
										return <TableCell>{getKeyValue(item, columnKey)}</TableCell>;
								}
							}}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</section>
	);
}
