"use client";

import { addToast } from "@heroui/toast";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { Button } from "@heroui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Chip } from "@heroui/chip";

import { useFetch } from "@/hooks/useFetch";
import { TForecastWithCardInfo } from "@/types/forecast";
import { IAPIResponse } from "@/types/global";
import { getBankLogo } from "@/config/bank";
import SYS_ICONS from "@/config/icons";

export default function SettingForecastPage() {
	const router = useRouter();

	const [listForecasts, setListForecasts] = useState<TForecastWithCardInfo[]>([]);

	const {
		data: fetchForecastResult,
		// loading: loadingForecast,
		error: errorForecast,
	} = useFetch<IAPIResponse<TForecastWithCardInfo[]>>("/forecasts");

	useEffect(() => {
		if (fetchForecastResult) {
			setListForecasts(fetchForecastResult.results ?? []);
		}

		if (errorForecast) {
			const parsedError = JSON.parse(errorForecast);

			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}
	}, [fetchForecastResult, errorForecast]);

	const forecastColumns = [
		{ key: "card_info", label: "Card Info" },
		{ key: "forecast_name", label: "Forecast Name" },
		{ key: "forecast_date", label: "Forecast Date" },
		{ key: "amount", label: "Amount" },
		{ key: "repeat_type", label: "Repeat Type" },
		{ key: "repeat_times", label: "Repeat Times" },
		{ key: "action", label: "Action" },
	];

	const handleDelete = (forecastId: number) => {
		fetch(`/api/forecasts/${forecastId}`, {
			method: "DELETE",
		})
			.then((response) => response.json())
			.then((response) => {
				if (response.status === "success") {
					setListForecasts((prevForecasts) =>
						prevForecasts.filter((forecast) => forecast.forecast_id !== forecastId)
					);
					addToast({
						title: "Success",
						description: response.message,
						color: "success",
					});
				} else {
					addToast({
						title: "Error",
						description: response.message,
						color: "danger",
					});
				}
			});
	};

	return (
		<div>
			<Table>
				<TableHeader columns={forecastColumns}>
					{(column) => (
						<TableColumn
							key={column.key}
							align={
								["amount", "action", "repeat_type", "repeat_times"].includes(column.key)
									? "center"
									: "start"
							}
						>
							{column.label}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody
					emptyContent={"No forecasts available"}
					items={listForecasts}
				>
					{(item) => (
						<TableRow key={item.forecast_id}>
							{forecastColumns.map((col) => {
								switch (col.key) {
									case "card_info":
										return (
											<TableCell key={col.key}>
												<div className="flex items-center gap-2">
													<Image
														alt={item.card_name}
														className="rounded max-w-4"
														height={1200}
														src={getBankLogo(item.bank_code, 1)}
														width={1200}
													/>
													<span>{item.card_name}</span>
												</div>
											</TableCell>
										);
									case "amount":
										return (
											<TableCell key={col.key}>
												<Chip
													className={"capitalize"}
													color={"primary"}
													variant={"flat"}
												>
													{item.amount?.toLocaleString()} VND
												</Chip>
											</TableCell>
										);
									case "forecast_date":
										return (
											<TableCell key={col.key}>
												{item.forecast_date
													? require("moment")(item.forecast_date).format("DD-MM-YYYY")
													: ""}
											</TableCell>
										);
									case "repeat_type":
										return (
											<TableCell key={col.key}>
												<Chip
													className={"capitalize"}
													color={"secondary"}
													variant={"flat"}
												>
													{item.repeat_type}
												</Chip>
											</TableCell>
										);
									case "repeat_times":
										return (
											<TableCell key={col.key}>
												<Chip
													className={"capitalize"}
													color={"warning"}
													variant={"flat"}
												>
													{item.repeat_times} times
												</Chip>
											</TableCell>
										);
									case "forecast_name":
										return <TableCell key={col.key}>{item.forecast_name}</TableCell>;
									case "action":
										return (
											<TableCell key={col.key}>
												<div className="flex justify-center gap-2">
													<Button
														isIconOnly
														color={"primary"}
														variant={"ghost"}
														onPress={() =>
															router.push(`/settings/forecasts/${item.forecast_id}`)
														}
													>
														{SYS_ICONS.DETAILS.MD}
													</Button>
													<Button
														isIconOnly
														color={"danger"}
														variant={"ghost"}
														onPress={() => handleDelete(+item.forecast_id)}
													>
														{SYS_ICONS.TRASH.MD}
													</Button>
												</div>
											</TableCell>
										);
									default:
										return <TableCell key={col.key}>{(item as any)[col.key]}</TableCell>;
								}
							})}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
