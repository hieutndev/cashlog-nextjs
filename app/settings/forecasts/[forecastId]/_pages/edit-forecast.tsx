"use client";

import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { ErrorObject } from "ajv";
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { Radio, RadioGroup } from "@heroui/radio";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { addToast } from "@heroui/toast";
import moment from "moment";
import clsx from "clsx";

import CustomForm from "@/components/shared/form/custom-form";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import { ListTransactionType } from "@/types/transaction";
import TransactionType from "@/components/transactions/transaction-type";
import { makeListDate } from "@/utils/text-transform";
import { TForecastWithCardInfo, TNewForecast, TUpdateForecast } from "@/types/forecast";

interface EditForecastProps {
	forecastId: string | number;
	forecastDetails?: TForecastWithCardInfo | null;
	onEditSuccess: () => void;
}

export default function EditForecast({ forecastId, forecastDetails, onEditSuccess }: EditForecastProps) {

	const [validateErrors, setValidateErrors] = useState<ErrorObject[]>([]);

	const [forecastInfo, setForecastInfo] = useState<TUpdateForecast>({
		forecast_name: "",
		amount: 0,
		direction: "in",
		card_id: "",
		forecast_date: moment().toISOString(),
		repeat_times: 1,
		repeat_type: "month",
		transaction_type: "receive",
	});

	const {
		data: updateForecastResult,
		error: updateForecastError,
		fetch: updateForecast,
	} = useFetch<IAPIResponse>(`/forecasts/${forecastId}`, {
		method: "PUT",
		body: forecastInfo,
		skip: true,
	});

	const handleUpdateForecast = async () => {
		await updateForecast();
	};

	useEffect(() => {
		if (forecastDetails) {
			setForecastInfo({
				forecast_name: forecastDetails.forecast_name,
				amount: forecastDetails.amount,
				direction: forecastDetails.direction,
				card_id: forecastDetails.card_id,
				forecast_date: forecastDetails.forecast_date,
				repeat_times: forecastDetails.repeat_times,
				repeat_type: forecastDetails.repeat_type,
				transaction_type: forecastDetails.transaction_type,
			});
		}
	}, [forecastDetails]);

	useEffect(() => {
		if (updateForecastResult) {
			addToast({
				title: "Success",
				description: updateForecastResult.message,
				color: "success",
			});
			onEditSuccess();
		}

		if (updateForecastError) {
			const parsedError = JSON.parse(updateForecastError);

			if (parsedError?.validateErrors) {
				setValidateErrors(parsedError.validateErrors);
			}
			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}
	}, [updateForecastResult, updateForecastError]);

	return (
		<CustomForm
			className={clsx("flex flex-col gap-4")}
			formId={"newForecastForm"}
			onSubmit={handleUpdateForecast}
		>
			<div className={"flex items-start gap-4"}>
				<div className={"flex flex-col gap-4 w-full"}>
					<Input
						isRequired
						errorMessage={getFieldError(validateErrors, "forecast_name")?.message}
						isInvalid={!!getFieldError(validateErrors, "forecast_name")}
						label={"Forecast Name"}
						labelPlacement={"outside"}
						name={"forecast_name"}
						placeholder={"Enter forecast name"}
						size={"lg"}
						value={forecastInfo.forecast_name}
						variant={"bordered"}
						onValueChange={(value) =>
							setForm<TNewForecast>(
								"forecast_name",
								value,
								validateErrors,
								setValidateErrors,
								setForecastInfo
							)
						}
					/>
					<RadioGroup
						isRequired
						classNames={{
							wrapper: "flex flex-row items-center gap-2",
						}}
						label={"Transaction Type"}
						size={"lg"}
						value={forecastInfo.transaction_type}
						onValueChange={(e) => {
							setForm<TNewForecast>(
								"transaction_type",
								e,
								validateErrors,
								setValidateErrors,
								setForecastInfo
							);
							setForm<TNewForecast>(
								"direction",
								["receive", "repay_received", "borrow"].includes(e) ? "in" : "out",
								validateErrors,
								setValidateErrors,
								setForecastInfo
							);
						}}
					>
						{ListTransactionType.filter((value) => value !== "init").map((type) => (
							<TransactionType
								key={type}
								type={type}
							/>
						))}
					</RadioGroup>
					<RadioGroup
						isRequired
						classNames={{
							wrapper: "flex flex-row items-center gap-4",
						}}
						label={"Repeat Type"}
						size={"lg"}
						value={forecastInfo.repeat_type}
						onValueChange={(e) =>
							setForm<TNewForecast>("repeat_type", e, validateErrors, setValidateErrors, setForecastInfo)
						}
					>
						{["hour", "day", "month", "year"].map((type) => (
							<Radio
								key={type}
								className={"capitalize"}
								value={type}
							>
								{type}
							</Radio>
						))}
					</RadioGroup>

					<div className={"flex items-center gap-4"}>
						<Input
							isRequired
							errorMessage={getFieldError(validateErrors, "amount")?.message}
							isInvalid={!!getFieldError(validateErrors, "amount")}
							label={"Amount"}
							labelPlacement={"outside"}
							name={"amount"}
							placeholder={"Enter amount"}
							size={"lg"}
							type={"number"}
							value={forecastInfo.amount.toString()}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<TNewForecast>(
									"amount",
									Number(value),
									validateErrors,
									setValidateErrors,
									setForecastInfo
								)
							}
						/>

						<DatePicker
							disableAnimation
							hideTimeZone
							isRequired
							showMonthAndYearPickers
							aria-label={"Forecast Date"}
							className={"w-max"}
							label={"Forecast Date"}
							labelPlacement={"outside"}
							size={"lg"}
							value={parseDate(moment(forecastInfo.forecast_date).format("YYYY-MM-DD"))}
							variant={"bordered"}
							onChange={(e) =>
								setForm<TNewForecast>(
									"forecast_date",
									e?.toDate(getLocalTimeZone()).toISOString() ?? moment().toISOString(),
									validateErrors,
									setValidateErrors,
									setForecastInfo
								)
							}
						/>

						<Input
							isRequired
							errorMessage={getFieldError(validateErrors, "repeat_times")?.message}
							isInvalid={!!getFieldError(validateErrors, "repeat_times")}
							label={"Repeat Times"}
							labelPlacement={"outside"}
							name={"repeat_times"}
							placeholder={"Enter repeat times"}
							size={"lg"}
							type={"number"}
							value={forecastInfo.repeat_times.toString()}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<TNewForecast>(
									"repeat_times",
									Number(value),
									validateErrors,
									setValidateErrors,
									setForecastInfo
								)
							}
						/>
					</div>
				</div>
				<div className={"min-w-96 flex flex-col gap-4"}>
					<Table>
						<TableHeader>
							<TableColumn>Pay Times</TableColumn>
							<TableColumn align={"end"}>Pay Date</TableColumn>
						</TableHeader>
						<TableBody>
							{makeListDate(
								new Date(forecastInfo.forecast_date),
								forecastInfo.repeat_times,
								forecastInfo.repeat_type
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
		</CustomForm>
	);
}
