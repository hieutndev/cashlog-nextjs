"use client";

import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { RadioGroup } from "@heroui/radio";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import clsx from "clsx";
import moment from "moment";
import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import { TCard } from "@/types/card";
import BankCardRadio from "@/components/shared/bank-card-radio/bank-card-radio";
import { TForecastRowData } from "@/types/forecast";
import ICONS from "@/configs/icons";
import { BREAK_POINT } from "@/configs/break-point";
import useScreenSize from "@/hooks/useScreenSize";

export default function ForecastsPage() {
	const {
		data: fetchCardResults,
		error: fetchCardError,
		// loading: fetchCardLoading,
	} = useFetch<IAPIResponse<TCard[]>>("/cards");

	const [listCards, setListCards] = useState<TCard[]>([]);
	const [selectedCard, setSelectedCard] = useState<number | null>(null);
	const [listForecasts, setListForecasts] = useState<TForecastRowData[]>([]);

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
	} = useFetch<IAPIResponse<TForecastRowData[]>>(`/cards/${selectedCard}/forecasts`, {
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

	const router = useRouter();

	const { width } = useScreenSize();

	return (
		<section className={"flex flex-col gap-4"}>
			<div className={"flex items-center justify-between"}>
				<h3 className={"text-2xl font-semibold"}>Forecasts Table</h3>
				<Button
					color={"primary"}
					isIconOnly={width < BREAK_POINT.SM}
					startContent={ICONS.NEW.MD}
					onPress={() => router.push("/settings/forecasts/new")}
				>
					{width >= BREAK_POINT.SM ? "Create new Forecast" : ""}
				</Button>
			</div>
			<div className={"flex items-center gap-4"}>
				<RadioGroup
					label={"Select card"}
					orientation="horizontal"
					value={selectedCard?.toString()}
					onValueChange={(value) => setSelectedCard(Number(value))}
				>
					{listCards && listCards.length > 0 ? (
						listCards.map((card) => (
							<BankCardRadio
								key={card.card_id}
								bank_code={card.bank_code}
								card_balance={card.card_balance}
								card_id={card.card_id}
								card_name={card.card_name}
							/>
						))
					) : (
						<Alert
							color={"primary"}
							title={"You don't have any cards yet."}
						/>
					)}
				</RadioGroup>
			</div>
			<Table isHeaderSticky>
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
												<p className={"min-w-max"}>
													{moment(getKeyValue(item, columnKey)).format("DD-MM-YYYY")}
												</p>
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
