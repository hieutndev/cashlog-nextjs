"use client";

import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { DatePicker } from "@heroui/date-picker";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { Radio, RadioGroup } from "@heroui/radio";
import { addToast } from "@heroui/toast";
import moment from "moment";
import clsx from "clsx";
import { useFetch } from "hieutndev-toolkit";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";

import { ZodCustomError } from "@/types/zod";
import CustomForm from "@/components/shared/form/custom-form";
import { API_ENDPOINT } from "@/configs/api-endpoint";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import { IAPIResponse } from "@/types/global";
import { TRecurringResponse, TFrequencyType, UpdateRecurringPayload } from "@/types/recurring";
import { TCategory } from "@/types/category";

interface EditRecurringProps {
	recurringId: string;
	recurringDetails?: TRecurringResponse | null;
	onEditSuccess: () => void;
}



export default function EditRecurring({ recurringId, recurringDetails, onEditSuccess }: EditRecurringProps) {
	const [validateErrors, setValidateErrors] = useState<ZodCustomError[]>([]);
	const [listCategories, setListCategories] = useState<TCategory[]>([]);

	const [recurringInfo, setRecurringInfo] = useState<UpdateRecurringPayload>({
		recurring_name: "",
		amount: 0,
		direction: "out",
		category_id: null,
		frequency: "monthly",
		interval: 1,
		start_date: moment().toISOString(),
		end_date: null,
		notes: "",
		apply_to_future: true,
		recreate_instances: true,
	});

	const {
		data: fetchCategoriesResult,
	} = useFetch<IAPIResponse<TCategory[]>>(API_ENDPOINT.CATEGORIES.BASE);

	const {
		data: updateRecurringResult,
		error: updateRecurringError,
		fetch: updateRecurring,
	} = useFetch<IAPIResponse>(API_ENDPOINT.RECURRINGS.BY_ID(recurringId), {
		method: "PUT",
		body: recurringInfo,
		skip: true,
	});

	const handleUpdateRecurring = async () => {
		await updateRecurring();
	};

	useEffect(() => {
		if (recurringDetails) {
			setRecurringInfo({
				recurring_name: recurringDetails.recurring_name,
				amount: recurringDetails.amount,
				direction: recurringDetails.direction,
				category_id: recurringDetails.category_id ? Number(recurringDetails.category_id) : null,
				frequency: recurringDetails.frequency,
				interval: recurringDetails.interval,
				start_date: recurringDetails.start_date,
				end_date: recurringDetails.end_date,
				notes: "",
				apply_to_future: true,
				recreate_instances: true,
			});
		}
	}, [recurringDetails]);

	useEffect(() => {
		if (fetchCategoriesResult) {
			setListCategories(fetchCategoriesResult.results ?? []);
		}
	}, [fetchCategoriesResult]);

	useEffect(() => {
		if (updateRecurringResult) {
			addToast({
				title: "Success",
				description: updateRecurringResult.message || "Recurring transaction updated successfully",
				color: "success",
			});
			onEditSuccess();
		}

		if (updateRecurringError) {
			const parsedError = JSON.parse(updateRecurringError);

			if (parsedError?.validateErrors) {
				setValidateErrors(parsedError.validateErrors);
			}
			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}
	}, [updateRecurringResult, updateRecurringError, onEditSuccess]);

	return (
		<div className={"flex gap-4 flex-col"}>
			<CustomForm
				className={clsx("w-full flex flex-col gap-4")}
				formId={"editRecurringForm"}
				submitButtonSize={"lg"}
				onSubmit={handleUpdateRecurring}
			>
				<div className={"flex flex-col gap-4 w-full"}>
					<Input
						isRequired
						errorMessage={getFieldError(validateErrors, "recurring_name")?.message}
						isInvalid={!!getFieldError(validateErrors, "recurring_name")}
						label={"Recurring Name"}
						labelPlacement={"outside"}
						name={"recurring_name"}
						placeholder={"Enter recurring transaction name"}
						size={"lg"}
						value={recurringInfo.recurring_name}
						variant={"bordered"}
						onValueChange={(value) =>
							setForm<UpdateRecurringPayload>(
								"recurring_name",
								value,
								validateErrors,
								setValidateErrors,
								setRecurringInfo
							)
						}
					/>

					<Select
						label={"Category (Optional)"}
						labelPlacement={"outside"}
						placeholder={"Select category"}
						selectedKeys={recurringInfo.category_id ? [recurringInfo.category_id.toString()] : []}
						size={"lg"}
						variant={"bordered"}
						onChange={(e) => {
							setForm<UpdateRecurringPayload>(
								"category_id",
								e.target.value ? Number(e.target.value) : null,
								validateErrors,
								setValidateErrors,
								setRecurringInfo
							);
						}}
					>
						{listCategories.map((category) => (
							<SelectItem
								key={category.category_id}
								className={"capitalize"}
							>
								{category.category_name}
							</SelectItem>
						))}
					</Select>

					<RadioGroup
						isRequired
						classNames={{
							wrapper: "flex flex-row items-center gap-4",
						}}
						label={"Frequency"}
						size={"lg"}
						value={recurringInfo.frequency}
						onValueChange={(e) =>
							setForm<UpdateRecurringPayload>("frequency", e as TFrequencyType, validateErrors, setValidateErrors, setRecurringInfo)
						}
					>
						{["daily", "weekly", "monthly", "yearly"].map((type) => (
							<Radio
								key={type}
								className={"capitalize"}
								value={type}
							>
								{type}
							</Radio>
						))}
					</RadioGroup>

					<div className={"flex flex-col sm:flex-row items-center gap-4"}>
						<Input
							fullWidth
							isRequired
							errorMessage={getFieldError(validateErrors, "amount")?.message}
							isInvalid={!!getFieldError(validateErrors, "amount")}
							label={"Amount"}
							labelPlacement={"outside"}
							name={"amount"}
							placeholder={"Enter amount"}
							size={"lg"}
							type={"number"}
							value={recurringInfo.amount.toString()}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<UpdateRecurringPayload>(
									"amount",
									Number(value),
									validateErrors,
									setValidateErrors,
									setRecurringInfo
								)
							}
						/>

						<Input
							fullWidth
							isRequired
							errorMessage={getFieldError(validateErrors, "interval")?.message}
							isInvalid={!!getFieldError(validateErrors, "interval")}
							label={"Interval"}
							labelPlacement={"outside"}
							name={"interval"}
							placeholder={"Every X " + recurringInfo.frequency}
							size={"lg"}
							type={"number"}
							value={recurringInfo.interval.toString()}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<UpdateRecurringPayload>(
									"interval",
									Number(value) || 1,
									validateErrors,
									setValidateErrors,
									setRecurringInfo
								)
							}
						/>
					</div>

					<div className={"flex flex-col sm:flex-row items-center gap-4"}>
						<DatePicker
							disableAnimation
							fullWidth
							hideTimeZone
							isRequired
							showMonthAndYearPickers
							aria-label={"Start Date"}
							className={"lg:w-max w-full"}
							label={"Start Date"}
							labelPlacement={"outside"}
							size={"lg"}
							value={parseDate(moment(recurringInfo.start_date).format("YYYY-MM-DD"))}
							variant={"bordered"}
							onChange={(e) =>
								setForm<UpdateRecurringPayload>(
									"start_date",
									e?.toDate(getLocalTimeZone()).toISOString() ?? moment().toISOString(),
									validateErrors,
									setValidateErrors,
									setRecurringInfo
								)
							}
						/>

						<DatePicker
							disableAnimation
							fullWidth
							hideTimeZone
							showMonthAndYearPickers
							aria-label={"End Date (Optional)"}
							className={"lg:w-max w-full"}
							label={"End Date (Optional)"}
							labelPlacement={"outside"}
							minValue={parseDate(moment(recurringInfo.start_date).add(1, 'day').format("YYYY-MM-DD"))}
							size={"lg"}
							value={recurringInfo.end_date ? parseDate(moment(recurringInfo.end_date).format("YYYY-MM-DD")) : null}
							variant={"bordered"}
							onChange={(e) =>
								setForm<UpdateRecurringPayload>(
									"end_date",
									e ? e.toDate(getLocalTimeZone())?.toISOString() : null,
									validateErrors,
									setValidateErrors,
									setRecurringInfo
								)
							}
						/>
					</div>

					<Textarea
						label={"Notes (Optional)"}
						labelPlacement={"outside"}
						minRows={3}
						placeholder={"Add notes about this update"}
						size={"lg"}
						value={recurringInfo.notes}
						variant={"bordered"}
						onValueChange={(value) =>
							setForm<UpdateRecurringPayload>(
								"notes",
								value,
								validateErrors,
								setValidateErrors,
								setRecurringInfo
							)
						}
					/>
				</div>
			</CustomForm>
		</div>
	);
}
