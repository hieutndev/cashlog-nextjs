"use client";

import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { ErrorObject } from "ajv";
import { RadioGroup } from "@heroui/radio";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Skeleton } from "@heroui/skeleton";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";
import moment from "moment";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";
import clsx from "clsx";
import { useFetch } from "hieutndev-toolkit";

import { TNewForecast } from "../../../../types/forecast";

import CustomForm from "@/components/shared/form/custom-form";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import BankCardRadio, { AccountCardProps } from "@/components/shared/bank-card-radio/bank-card-radio";
import { TCard } from "@/types/card";
import { IAPIResponse } from "@/types/global";
import { makeListDate, upperFirstLetter } from "@/utils/text-transform";
import { makeSuggestAmount } from "@/utils/make-suggest-amount";
import TransactionType from "@/components/transactions/transaction-type";

export default function NewForecastPage() {
	const router = useRouter();

	const [validateErrors, setValidateErrors] = useState<ErrorObject[]>([]);

	const [newForecast, setNewForecast] = useState<TNewForecast>({
		forecast_name: "",
		amount: 0,
		direction: "in",
		card_id: 0,
		forecast_date: moment().toISOString(),
		repeat_times: 1,
		repeat_type: "month",
	});

	const [listCard, setListCard] = useState<AccountCardProps[]>([]);

	const {
		data: fetchCardsResult,
		loading: loadingCards,
		error: errorCards,
		// fetch: fetchCards,
	} = useFetch<IAPIResponse<TCard[]>>("/cards");

	const {
		data: createForecastResult,
		// loading: loadingCreateForecast,
		error: errorCreateForecast,
		fetch: createForecast,
	} = useFetch<IAPIResponse>("/forecasts", {
		method: "POST",
		body: newForecast,
		skip: true,
	});

	const handleCreateForecast = async () => {
		await createForecast();
	};

	useEffect(() => {
		if (errorCreateForecast) {
			const parsedError = JSON.parse(errorCreateForecast);

			if (parsedError?.validateErrors) {
				setValidateErrors(parsedError.validateErrors);
			}
			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}

		if (createForecastResult) {
			addToast({
				title: "Success",
				description: createForecastResult?.message,
				color: "success",
			});
			router.push("/settings/forecasts");
		}
	}, [errorCreateForecast, createForecastResult]);

	useEffect(() => {
		if (fetchCardsResult) {
			setListCard(fetchCardsResult.results ?? []);
			setNewForecast((prev) => ({
				...prev,
				card_id:
					fetchCardsResult?.results && fetchCardsResult?.results[0] ? fetchCardsResult.results[0].card_id : 0,
			}));
		}
	}, [fetchCardsResult, errorCards]);

	return (
		<div className="col-span-12 lg:col-span-10 w-full flex flex-col gap-4">
			<h3 className={"text-2xl font-semibold"}>New Forecast</h3>
			<div className={"flex gap-4 flex-col-reverse lg:flex-row"}>
				<CustomForm
					className={clsx("flex flex-col gap-4")}
					formId={"newForecastForm"}
					onSubmit={handleCreateForecast}
				>
					<div className={"flex flex-col gap-4 w-full lg:border-r lg:border-gray-200 lg:pr-4"}>
						<Input
							isRequired
							errorMessage={getFieldError(validateErrors, "forecast_name")?.message}
							isInvalid={!!getFieldError(validateErrors, "forecast_name")}
							label={"Forecast Name"}
							labelPlacement={"outside"}
							name={"forecast_name"}
							placeholder={"Enter forecast name"}
							value={newForecast.forecast_name}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<TNewForecast>(
									"forecast_name",
									value,
									validateErrors,
									setValidateErrors,
									setNewForecast
								)
							}
						/>
						<RadioGroup
							isRequired
							classNames={{
								label: "text-sm",
							}}
							label={"Select Card"}
							value={newForecast.card_id.toString()}
							onValueChange={(e) =>
								setForm<TNewForecast>("card_id", +e, validateErrors, setValidateErrors, setNewForecast)
							}
						>
							<ScrollShadow
								hideScrollBar
								className={"flex flex-col gap-2 max-h-84"}
							>
								{loadingCards ? (
									<Skeleton className={"w-96 h-14 rounded-2xl flex justify-start items-center"} />
								) : (
									listCard.map((card) => (
										<BankCardRadio
											key={card.card_id}
											{...card}
										/>
									))
								)}
							</ScrollShadow>
						</RadioGroup>
						<RadioGroup
							isRequired
							classNames={{
								wrapper: "flex flex-row items-center gap-2",
							}}
							label={"Transaction Type"}
							value={newForecast.direction}
							onValueChange={(e) => {
								setForm<TNewForecast>(
									"direction",
									e,
									validateErrors,
									setValidateErrors,
									setNewForecast
								);
							}}
						>
							<TransactionType
								key={"in"}
								type={"in"}
							/>
							<TransactionType
								key={"out"}
								type={"out"}
							/>
						</RadioGroup>
						<div className={"grid sm:grid-cols-3 items-center gap-4 sm:gap-2"}>
							<DatePicker
								disableAnimation
								hideTimeZone
								isRequired
								showMonthAndYearPickers
								aria-label={"Forecast Date"}
								label={"Forecast Date"}
								labelPlacement={"outside"}
								value={parseDate(moment(newForecast.forecast_date).format("YYYY-MM-DD"))}
								variant={"bordered"}
								onChange={(e) =>
									setForm<TNewForecast>(
										"forecast_date",
										e?.toDate(getLocalTimeZone())?.toISOString() ?? moment().toISOString(),
										validateErrors,
										setValidateErrors,
										setNewForecast
									)
								}
							/>
							<Select
								isRequired
								disallowEmptySelection={true}
								label={"Repeat Type"}
								labelPlacement={"outside"}
								placeholder={"Select repeat type"}
								renderValue={(selectedKeys) => {
									return upperFirstLetter(selectedKeys[0].textValue || "");
								}}
								selectedKeys={[newForecast.repeat_type]}
								variant={"bordered"}
								onChange={(e) => {
									setForm<TNewForecast>(
										"repeat_type",
										e.target.value,
										validateErrors,
										setValidateErrors,
										setNewForecast
									);
								}}
							>
								{["hour", "day", "month", "year"].map((type) => (
									<SelectItem
										key={type}
										className={"capitalize"}
									>
										{type}
									</SelectItem>
								))}
							</Select>
							<Input
								isRequired
								errorMessage={getFieldError(validateErrors, "repeat_times")?.message}
								isInvalid={!!getFieldError(validateErrors, "repeat_times")}
								label={"Repeat Times"}
								labelPlacement={"outside"}
								name={"repeat_times"}
								placeholder={"Enter repeat times"}
								type={"number"}
								value={newForecast.repeat_times.toString()}
								variant={"bordered"}
								onValueChange={(value) =>
									setForm<TNewForecast>(
										"repeat_times",
										Number(value),
										validateErrors,
										setValidateErrors,
										setNewForecast
									)
								}
							/>
						</div>

						<div className={"flex flex-col gap-2"}>
							<Input
								isRequired
								errorMessage={getFieldError(validateErrors, "amount")?.message}
								isInvalid={!!getFieldError(validateErrors, "amount")}
								label={"Amount"}
								labelPlacement={"outside"}
								name={"amount"}
								placeholder={"Enter amount"}
								type={"number"}
								value={newForecast.amount.toString()}
								variant={"bordered"}
								onValueChange={(value) =>
									setForm<TNewForecast>(
										"amount",
										Number(value),
										validateErrors,
										setValidateErrors,
										setNewForecast
									)
								}
							/>
							<div className={"flex items-center gap-1"}>
								{makeSuggestAmount(newForecast.amount).map((val, index) => (
									<Chip
										key={index}
										classNames={{
											content: index === 0 && "font-semibold",
										}}
										color={index === 0 ? "primary" : "default"}
										size={"sm"}
										variant={"flat"}
										onClick={() =>
											setForm("amount", val, validateErrors, setValidateErrors, setNewForecast)
										}
									>
										{index === 0 && "Current: "}
										{val.toLocaleString()}
									</Chip>
								))}
							</div>
						</div>
					</div>
				</CustomForm>
				<div
					className={
						"w-full xl:min-w-96 flex flex-col gap-2 border-b border-gray-200 pb-4 lg:pb-0 lg:border-b-0"
					}
				>
					<Table
						className={"max-h-52 xl:max-h-full"}
						classNames={{
							wrapper: "bg-transparent shadow-none py-0 px-0",
						}}
						// topContent={<p className={"text-sm text-muted text-center font-medium"}>Forecast Pay Date</p>}
					>
						<TableHeader>
							<TableColumn>Pay Times</TableColumn>
							<TableColumn align={"end"}>Date</TableColumn>
						</TableHeader>
						<TableBody>
							{makeListDate(
								new Date(newForecast.forecast_date),
								newForecast.repeat_times,
								newForecast.repeat_type
							).map((date, index) => (
								<TableRow key={index}>
									<TableCell>#{index + 1}</TableCell>
									<TableCell>{moment(date).format("DD-MM-YYYY")}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</div>
	);
}
