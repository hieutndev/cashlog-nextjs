"use client";

import type { ZodCustomError } from "@/types/zod";
import type { TCard } from "@/types/card";
import type { TCategory } from "@/types/category";
import type { TFrequencyType, TRecurringDirection, TFrequencyConfig, TAdjustmentType, TRecurringResponse, TRecurringForm } from "@/types/recurring";

import { Input } from "@heroui/input";
import { useEffect, useState, useMemo } from "react";
import { RadioGroup } from "@heroui/radio";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { addToast } from "@heroui/toast";
import moment from "moment";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { DatePicker } from "@heroui/date-picker";
import clsx from "clsx";
import { Textarea } from "@heroui/input";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";

import { useCardEndpoint } from "@/hooks/useCardEndpoint";
import { useCategoryEndpoint } from "@/hooks/useCategoryEndpoint";
import { useRecurringFormEndpoint } from "@/hooks/useRecurringFormEndpoint";
import CustomForm from "@/components/shared/form/custom-form";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import { upperFirstLetter } from "@/utils/text-transform";
import { makeSuggestAmount } from "@/utils/make-suggest-amount";
import TransactionType from "@/components/transactions/transaction-type";
import SelectCardRadioGroup from "@/components/shared/select-card-radio-group/select-card-radio-group";

interface RecurringFormProps {
	mode: "create" | "update";
	initialData?: TRecurringResponse | null;
	onSuccess?: () => void;
	recurringId?: string;
}

// Days of week for weekly frequency
const DAYS_OF_WEEK = [
	{ value: 0, label: "Sunday" },
	{ value: 1, label: "Monday" },
	{ value: 2, label: "Tuesday" },
	{ value: 3, label: "Wednesday" },
	{ value: 4, label: "Thursday" },
	{ value: 5, label: "Friday" },
	{ value: 6, label: "Saturday" },
];

// Helper to calculate next occurrences with frequency config support
function calculateNextOccurrences(
	startDate: Date,
	frequency: TFrequencyType,
	interval: number,
	frequencyConfig: TFrequencyConfig,
	count: number = 10
): Date[] {
	const dates: Date[] = [];
	let currentDate = new Date(startDate);
	const maxIterations = count * 10;
	let iterations = 0;

	while (dates.length < count && iterations < maxIterations) {
		iterations++;

		switch (frequency) {
			case 'daily':
				dates.push(new Date(currentDate));
				currentDate.setDate(currentDate.getDate() + interval);
				break;

			case 'weekly':
				const daysOfWeek = frequencyConfig.daysOfWeek || [startDate.getDay()];

				if (dates.length === 0 && daysOfWeek.includes(currentDate.getDay())) {
					dates.push(new Date(currentDate));
				}

				let foundInWeek = false;

				for (let i = 1; i <= 7; i++) {
					const testDate = new Date(currentDate);

					testDate.setDate(testDate.getDate() + i);

					if (daysOfWeek.includes(testDate.getDay())) {
						currentDate = testDate;
						dates.push(new Date(currentDate));
						foundInWeek = true;
						break;
					}
				}

				if (!foundInWeek) {
					currentDate.setDate(currentDate.getDate() + (interval * 7));
				}
				break;

			case 'monthly':
				const dayOfMonth = frequencyConfig.dayOfMonth || startDate.getDate();
				const adjustment = frequencyConfig.adjustment || 'last';

				const year = currentDate.getFullYear();
				const month = currentDate.getMonth();
				const daysInMonth = new Date(year, month + 1, 0).getDate();

				let targetDay = dayOfMonth;

				if (dayOfMonth > daysInMonth) {
					switch (adjustment) {
						case 'last':
							targetDay = daysInMonth;
							break;
						case 'next':
							// Use first day of next month
							const nextMonthDate = new Date(year, month + 1, 1);

							dates.push(new Date(nextMonthDate));
							// Move to next interval (set to day 1 first to avoid overflow)
							currentDate.setDate(1);
							currentDate.setMonth(currentDate.getMonth() + interval);
							continue;
						case 'skip':
							// Skip this month entirely
							currentDate.setDate(1);
							currentDate.setMonth(currentDate.getMonth() + interval);
							continue;
					}
				}

				// Set the target day for this month
				currentDate.setDate(targetDay);
				dates.push(new Date(currentDate));

				// Move to next interval (set to day 1 first to avoid overflow)
				currentDate.setDate(1);
				currentDate.setMonth(currentDate.getMonth() + interval);
				break;

			case 'yearly':
				const targetMonth = (frequencyConfig.month || (startDate.getMonth() + 1)) - 1;
				const targetDayOfYear = frequencyConfig.day || startDate.getDate();
				const yearAdjustment = frequencyConfig.adjustment || 'last';

				const currentYear = currentDate.getFullYear();
				const daysInTargetMonth = new Date(currentYear, targetMonth + 1, 0).getDate();

				let yearTargetDay = targetDayOfYear;

				if (targetDayOfYear > daysInTargetMonth) {
					switch (yearAdjustment) {
						case 'last':
							yearTargetDay = daysInTargetMonth;
							break;
						case 'next':
							// Use first day of next month
							const nextMonthYearDate = new Date(currentYear, targetMonth + 1, 1);

							dates.push(new Date(nextMonthYearDate));
							// Move to next year (set to day 1 and month 0 first to avoid overflow)
							currentDate.setDate(1);
							currentDate.setMonth(0);
							currentDate.setFullYear(currentDate.getFullYear() + interval);
							continue;
						case 'skip':
							// Skip this year entirely
							currentDate.setDate(1);
							currentDate.setMonth(0);
							currentDate.setFullYear(currentDate.getFullYear() + interval);
							continue;
					}
				}

				// Set the target month and day for this year
				currentDate.setMonth(targetMonth);
				currentDate.setDate(yearTargetDay);
				dates.push(new Date(currentDate));

				// Move to next year (set to day 1 and month 0 first to avoid overflow)
				currentDate.setDate(1);
				currentDate.setMonth(0);
				currentDate.setFullYear(currentDate.getFullYear() + interval);
				break;
		}
	}

	return dates.slice(0, count);
}

export default function RecurringForm({ mode, initialData, onSuccess, recurringId }: RecurringFormProps) {
	const [validateErrors, setValidateErrors] = useState<ZodCustomError[]>([]);
	const [listCard, setListCard] = useState<TCard[]>([]);
	const [listCategories, setListCategories] = useState<TCategory[]>([]);
	const { useGetListCards } = useCardEndpoint();
	const { useGetCategories } = useCategoryEndpoint();
	const { useCreateRecurring, useUpdateRecurring } = useRecurringFormEndpoint();

	const [formData, setFormData] = useState<TRecurringForm>({
		recurring_name: "",
		amount: 0,
		direction: "out",
		card_id: 0,
		category_id: null,
		frequency: "monthly",
		interval: 1,
		frequency_config: {},
		start_date: moment().toISOString(),
		end_date: null,
		notes: "",
		...(mode === "update" && { apply_to_future: true, recreate_instances: true }),
	});

	const {
		data: fetchCardsResult,
		// loading: loadingCards,
		error: errorCards,
	} = useGetListCards();

	const {
		data: fetchCategoriesResult,
		error: errorCategories,
	} = useGetCategories();

	const createHook = useCreateRecurring(formData);
	const updateHook = useUpdateRecurring(recurringId ?? "", formData);

	const {
		data: submitResult,
		error: submitError,
		fetch: submitForm,
	} = mode === "create" ? createHook : updateHook;

	const handleSubmit = async () => {
		await submitForm();
	};

	// Initialize form with existing data in update mode
	useEffect(() => {
		if (mode === "update" && initialData) {
			setFormData({
				recurring_name: initialData.recurring_name,
				amount: initialData.amount,
				direction: initialData.direction,
				card_id: initialData.card_id,
				category_id: initialData.category_id ? Number(initialData.category_id) : null,
				frequency: initialData.frequency,
				interval: initialData.interval,
				frequency_config: initialData.frequency_config || {},
				start_date: initialData.start_date,
				end_date: initialData.end_date,
				notes: "",
				apply_to_future: true,
				recreate_instances: true,
			});
		}
	}, [mode, initialData]);

	useEffect(() => {
		if (submitError) {
			const parsedError = JSON.parse(submitError);

			if (parsedError?.validateErrors) {
				setValidateErrors(parsedError.validateErrors);
			}
			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}

		if (submitResult) {
			addToast({
				title: "Success",
				description: submitResult?.message || `Recurring transaction ${mode === "create" ? "created" : "updated"} successfully`,
				color: "success",
			});
			if (onSuccess) {
				onSuccess();
			}
		}
	}, [submitError, submitResult, mode, onSuccess]);

	useEffect(() => {
		if (fetchCardsResult) {
			setListCard(fetchCardsResult.results ?? []);
			if (mode === "create") {
				setFormData((prev) => ({
					...prev,
					card_id:
						fetchCardsResult?.results && fetchCardsResult?.results[0] ? fetchCardsResult.results[0].card_id : 0,
				}));
			}
		}
	}, [fetchCardsResult, errorCards, mode]);

	useEffect(() => {
		if (fetchCategoriesResult) {
			setListCategories(fetchCategoriesResult.results ?? []);
		}
	}, [fetchCategoriesResult, errorCategories]);

	const nextOccurrences = useMemo(() => {
		return calculateNextOccurrences(
			new Date(formData.start_date),
			formData.frequency,
			formData.interval || 1,
			formData.frequency_config,
			10
		);
	}, [formData.start_date, formData.frequency, formData.interval, formData.frequency_config]);

	return (
		<div className="w-full flex flex-col gap-4">
			<div className={"w-full flex flex-col gap-4 rounded-3xl p-4 bg-white shadow-md border border-gray-100"}>
				<p className={"text-sm font-semibold text-center "}>Next 10 Occurrences Preview</p>
				<Table
					isHeaderSticky
					className={"max-h-72"}
				>
					<TableHeader>
						<TableColumn>Occurrence</TableColumn>
						<TableColumn align={"end"}>Date</TableColumn>
					</TableHeader>
					<TableBody className={"scrollbar-hide"}>
						{nextOccurrences.map((date, index) => (
							<TableRow key={index}>
								<TableCell>#{index + 1}</TableCell>
								<TableCell>{moment(date).format("DD-MM-YYYY")}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Form Section */}
			<CustomForm
				className={clsx("flex flex-col gap-4")}
				formId={`${mode}RecurringForm`}
				loadingText={mode === "create" ? "Creating..." : "Updating..."}
				submitButtonSize={"md"}
				submitButtonText={mode === "create" ? "Create Recurring Transaction" : "Update Recurring Transaction"}
				onSubmit={handleSubmit}
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

						value={formData.recurring_name}
						variant={"bordered"}
						onValueChange={(value) =>
							setForm<TRecurringForm>(
								"recurring_name",
								value,
								validateErrors,
								setValidateErrors,
								setFormData
							)
						}
					/>

					{mode === "create" && (
						<SelectCardRadioGroup
							compact
							cards={listCard}
							label="Select Card"
							value={formData.card_id}
							onValueChange={(e) =>
								setForm<TRecurringForm>("card_id", +e, validateErrors, setValidateErrors, setFormData)
							}
						/>
					)}


					<div className={"grid grid-cols-2 gap-4"}>
						<Select
							label={"Category"}
							labelPlacement={"outside"}
							placeholder={"Select category"}
							selectedKeys={formData.category_id ? [formData.category_id.toString()] : []}
							variant={"bordered"}
							onChange={(e) => {
								setForm<TRecurringForm>(
									"category_id",
									e.target.value ? Number(e.target.value) : null,
									validateErrors,
									setValidateErrors,
									setFormData
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
								wrapper: "flex flex-row items-center gap-2",
								label: "text-default-900"
							}}
							label={"Transaction Type"}
							orientation="horizontal"
							value={formData.direction}
							onValueChange={(e) => {
								setForm<TRecurringForm>(
									"direction",
									e as TRecurringDirection,
									validateErrors,
									setValidateErrors,
									setFormData
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
					</div>

					<div className={"grid sm:grid-cols-4 items-center gap-4 sm:gap-2"}>
						<DatePicker
							disableAnimation
							hideTimeZone
							isRequired
							showMonthAndYearPickers
							aria-label={"Start Date"}
							label={"Start Date"}
							labelPlacement={"outside"}
							value={parseDate(moment(formData.start_date).format("YYYY-MM-DD"))}
							variant={"bordered"}
							onChange={(e) => {
								const newDate = e?.toDate(getLocalTimeZone())?.toISOString() ?? moment().toISOString();

								setForm<TRecurringForm>(
									"start_date",
									newDate,
									validateErrors,
									setValidateErrors,
									setFormData
								);
								setFormData((prev) => ({
									...prev,
									frequency_config: {},
								}));
							}}
						/>
						<DatePicker
							disableAnimation
							hideTimeZone
							showMonthAndYearPickers
							aria-label={"End Date"}
							label={"End Date"}
							labelPlacement={"outside"}
							minValue={parseDate(moment(formData.start_date).add(1, 'day').format("YYYY-MM-DD"))}
							value={formData.end_date ? parseDate(moment(formData.end_date).format("YYYY-MM-DD")) : null}
							variant={"bordered"}
							onChange={(e) =>
								setForm<TRecurringForm>(
									"end_date",
									e ? e.toDate(getLocalTimeZone())?.toISOString() : null,
									validateErrors,
									setValidateErrors,
									setFormData
								)
							}
						/>
						<Select
							isRequired
							disallowEmptySelection={true}
							label={"Frequency"}
							labelPlacement={"outside"}
							placeholder={"Select frequency"}
							renderValue={(selectedKeys) => {
								return upperFirstLetter(selectedKeys[0].textValue || "");
							}}
							selectedKeys={[formData.frequency]}
							variant={"bordered"}
							onChange={(e) => {
								setForm<TRecurringForm>(
									"frequency",
									e.target.value as TFrequencyType,
									validateErrors,
									setValidateErrors,
									setFormData
								);
								setFormData((prev) => ({
									...prev,
									frequency_config: {},
								}));
							}}
						>
							{["daily", "weekly", "monthly", "yearly"].map((type) => (
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
							errorMessage={getFieldError(validateErrors, "interval")?.message}
							isInvalid={!!getFieldError(validateErrors, "interval")}
							label={"Interval"}
							labelPlacement={"outside"}
							name={"interval"}
							placeholder={"Every X " + formData.frequency}
							type={"number"}
							value={formData.interval?.toString() || "1"}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<TRecurringForm>(
									"interval",
									Number(value) || 1,
									validateErrors,
									setValidateErrors,
									setFormData
								)
							}
						/>
					</div>

					{/* Frequency Configuration Fields */}
					{formData.frequency === 'weekly' && (
						<div className={"flex flex-col gap-2"}>
							<label className={"text-sm font-medium"} htmlFor="daysOfWeek">Days of Week</label>
							<CheckboxGroup
								id="daysOfWeek"
								orientation="horizontal"
								value={(formData.frequency_config.daysOfWeek || [new Date(formData.start_date).getDay()]).map(String)}
								onValueChange={(values) => {
									setFormData((prev) => ({
										...prev,
										frequency_config: {
											...prev.frequency_config,
											daysOfWeek: values.map(Number).sort((a, b) => a - b),
										},
									}));
								}}
							>
								<div className={"flex flex-wrap gap-2"}>
									{DAYS_OF_WEEK.map((day) => (
										<Checkbox
											key={day.value}
											value={day.value.toString()}
										>
											{day.label}
										</Checkbox>
									))}
								</div>
							</CheckboxGroup>
						</div>
					)}
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
							value={formData.amount.toString()}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<TRecurringForm>(
									"amount",
									Number(value),
									validateErrors,
									setValidateErrors,
									setFormData
								)
							}
						/>

						<div className={"flex items-center gap-1"}>
							{makeSuggestAmount(formData.amount).map((val, index) => (
								<Chip
									key={index}
									classNames={{
										content: index === 0 && "font-semibold",
									}}
									color={index === 0 ? "primary" : "default"}
									size={"sm"}
									variant={"flat"}
									onClick={() =>
										setForm("amount", val, validateErrors, setValidateErrors, setFormData)
									}
								>
									{index === 0 && "Current: "}
									{val.toLocaleString()}
								</Chip>
							))}
						</div>
					</div>

					{formData.frequency === 'monthly' && (
						<div className={"flex flex-col gap-4"}>
							<Input
								label={"Day of Month"}
								labelPlacement={"outside"}
								max={31}
								min={1}
								placeholder={"Day of month (1-31)"}
								type={"number"}
								value={(formData.frequency_config.dayOfMonth || new Date(formData.start_date).getDate()).toString()}
								variant={"bordered"}
								onValueChange={(value) => {
									const numValue = Number(value);

									if (numValue >= 1 && numValue <= 31) {
										setFormData((prev) => ({
											...prev,
											frequency_config: {
												...prev.frequency_config,
												dayOfMonth: numValue,
											},
										}));
									}
								}}
							/>
							<Select
								label={"Adjustment Strategy"}
								labelPlacement={"outside"}
								placeholder={"What to do if day doesn't exist"}
								selectedKeys={[formData.frequency_config.adjustment || 'last']}
								variant={"bordered"}
								onChange={(e) => {
									setFormData((prev) => ({
										...prev,
										frequency_config: {
											...prev.frequency_config,
											adjustment: e.target.value as TAdjustmentType,
										},
									}));
								}}
							>
								<SelectItem key="last">Use last day of month</SelectItem>
								<SelectItem key="next">Use first day of next month</SelectItem>
								<SelectItem key="skip">Skip that month</SelectItem>
							</Select>
						</div>
					)}

					{formData.frequency === 'yearly' && (
						<div className={"flex flex-col gap-4"}>
							<div className={"grid grid-cols-2 gap-4"}>
								<Select
									label={"Month"}
									labelPlacement={"outside"}
									placeholder={"Select month"}
									selectedKeys={[(formData.frequency_config.month || (new Date(formData.start_date).getMonth() + 1)).toString()]}
									variant={"bordered"}
									onChange={(e) => {
										setFormData((prev) => ({
											...prev,
											frequency_config: {
												...prev.frequency_config,
												month: Number(e.target.value),
											},
										}));
									}}
								>
									{moment.months().map((month, index) => (
										<SelectItem key={(index + 1).toString()}>{month}</SelectItem>
									))}
								</Select>
								<Input
									label={"Day"}
									labelPlacement={"outside"}
									max={31}
									min={1}
									placeholder={"Day (1-31)"}
									type={"number"}
									value={(formData.frequency_config.day || new Date(formData.start_date).getDate()).toString()}
									variant={"bordered"}
									onValueChange={(value) => {
										const numValue = Number(value);

										if (numValue >= 1 && numValue <= 31) {
											setFormData((prev) => ({
												...prev,
												frequency_config: {
													...prev.frequency_config,
													day: numValue,
												},
											}));
										}
									}}
								/>
							</div>
							<Select
								label={"Adjustment Strategy"}
								labelPlacement={"outside"}
								placeholder={"What to do if day doesn't exist"}
								selectedKeys={[formData.frequency_config.adjustment || 'last']}
								variant={"bordered"}
								onChange={(e) => {
									setFormData((prev) => ({
										...prev,
										frequency_config: {
											...prev.frequency_config,
											adjustment: e.target.value as TAdjustmentType,
										},
									}));
								}}
							>
								<SelectItem key="last">Use last day of month</SelectItem>
								<SelectItem key="next">Use first day of next month</SelectItem>
								<SelectItem key="skip">Skip that year</SelectItem>
							</Select>
						</div>
					)}





					<Textarea
						label={"Notes"}
						labelPlacement={"outside"}
						minRows={3}
						placeholder={mode === "create" ? "Add notes about this recurring transaction" : "Add notes about this update"}
						value={formData.notes}
						variant={"bordered"}
						onValueChange={(value) =>
							setForm<TRecurringForm>(
								"notes",
								value,
								validateErrors,
								setValidateErrors,
								setFormData
							)
						}
					/>
				</div>
			</CustomForm>
		</div>
	);
}
