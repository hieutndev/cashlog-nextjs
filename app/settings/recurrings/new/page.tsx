"use client";

import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
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
import { Textarea } from "@heroui/input";

import { ZodCustomError } from "@/types/zod";
import CustomForm from "@/components/shared/form/custom-form";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import BankCardRadio, { AccountCardProps } from "@/components/shared/bank-card-radio/bank-card-radio";
import { TCard } from "@/types/card";
import { IAPIResponse } from "@/types/global";
import { upperFirstLetter } from "@/utils/text-transform";
import { makeSuggestAmount } from "@/utils/make-suggest-amount";
import TransactionType from "@/components/transactions/transaction-type";
import { TCategory } from "@/types/category";
import { TFrequencyType, TRecurringDirection, TFrequencyConfig } from "@/types/recurring";

interface NewRecurringForm {
	recurring_name: string;
	amount: number;
	direction: TRecurringDirection;
	card_id: number;
	category_id: number | null;
	frequency: TFrequencyType;
	interval: number;
	frequency_config: TFrequencyConfig;
	start_date: string;
	end_date: string | null;
	notes: string;
}

// Helper to calculate next occurrences
function calculateNextOccurrences(
	startDate: Date,
	frequency: TFrequencyType,
	interval: number,
	count: number = 5
): Date[] {
	const dates: Date[] = [];
	let currentDate = new Date(startDate);

	for (let i = 0; i < count; i++) {
		dates.push(new Date(currentDate));

		switch (frequency) {
			case 'daily':
				currentDate.setDate(currentDate.getDate() + interval);
				break;
			case 'weekly':
				currentDate.setDate(currentDate.getDate() + (interval * 7));
				break;
			case 'monthly':
				currentDate.setMonth(currentDate.getMonth() + interval);
				break;
			case 'yearly':
				currentDate.setFullYear(currentDate.getFullYear() + interval);
				break;
		}
	}

	return dates;
}

export default function NewRecurringPage() {
	const router = useRouter();

	const [validateErrors, setValidateErrors] = useState<ZodCustomError[]>([]);

	const [newRecurring, setNewRecurring] = useState<NewRecurringForm>({
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
	});

	const [listCard, setListCard] = useState<AccountCardProps[]>([]);
	const [listCategories, setListCategories] = useState<TCategory[]>([]);

	const {
		data: fetchCardsResult,
		loading: loadingCards,
		error: errorCards,
	} = useFetch<IAPIResponse<TCard[]>>("/cards");

	const {
		data: fetchCategoriesResult,
		error: errorCategories,
	} = useFetch<IAPIResponse<TCategory[]>>("/categories");

	const {
		data: createRecurringResult,
		error: errorCreateRecurring,
		fetch: createRecurring,
	} = useFetch<IAPIResponse>("/recurrings", {
		method: "POST",
		body: newRecurring,
		skip: true,
	});

	const handleCreateRecurring = async () => {
		await createRecurring();
	};

	useEffect(() => {
		if (errorCreateRecurring) {
			const parsedError = JSON.parse(errorCreateRecurring);

			if (parsedError?.validateErrors) {
				setValidateErrors(parsedError.validateErrors);
			}
			addToast({
				title: "Error",
				description: parsedError.message,
				color: "danger",
			});
		}

		if (createRecurringResult) {
			addToast({
				title: "Success",
				description: createRecurringResult?.message || "Recurring transaction created successfully",
				color: "success",
			});
			router.push("/settings/recurrings");
		}
	}, [errorCreateRecurring, createRecurringResult, router]);

	useEffect(() => {
		if (fetchCardsResult) {
			setListCard(fetchCardsResult.results ?? []);
			setNewRecurring((prev) => ({
				...prev,
				card_id:
					fetchCardsResult?.results && fetchCardsResult?.results[0] ? fetchCardsResult.results[0].card_id : 0,
			}));
		}
	}, [fetchCardsResult, errorCards]);

	useEffect(() => {
		if (fetchCategoriesResult) {
			setListCategories(fetchCategoriesResult.results ?? []);
		}
	}, [fetchCategoriesResult, errorCategories]);

	const nextOccurrences = calculateNextOccurrences(
		new Date(newRecurring.start_date),
		newRecurring.frequency,
		newRecurring.interval,
		5
	);

	return (
		<div className="col-span-12 lg:col-span-10 w-full flex flex-col gap-4">
			<h3 className={"text-2xl font-semibold"}>New Recurring Transaction</h3>
			<div className={"flex gap-4 flex-col-reverse lg:flex-row"}>
				<CustomForm
					className={clsx("flex flex-col gap-4")}
					formId={"newRecurringForm"}
					onSubmit={handleCreateRecurring}
				>
					<div className={"flex flex-col gap-4 w-full lg:border-r lg:border-gray-200 lg:pr-4"}>
						<Input
							isRequired
							errorMessage={getFieldError(validateErrors, "recurring_name")?.message}
							isInvalid={!!getFieldError(validateErrors, "recurring_name")}
							label={"Recurring Name"}
							labelPlacement={"outside"}
							name={"recurring_name"}
							placeholder={"Enter recurring transaction name"}
							value={newRecurring.recurring_name}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<NewRecurringForm>(
									"recurring_name",
									value,
									validateErrors,
									setValidateErrors,
									setNewRecurring
								)
							}
						/>
						<RadioGroup
							isRequired
							classNames={{
								label: "text-sm",
							}}
							label={"Select Card"}
							value={newRecurring.card_id.toString()}
							onValueChange={(e) =>
								setForm<NewRecurringForm>("card_id", +e, validateErrors, setValidateErrors, setNewRecurring)
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

						<Select
							label={"Category (Optional)"}
							labelPlacement={"outside"}
							placeholder={"Select category"}
							selectedKeys={newRecurring.category_id ? [newRecurring.category_id.toString()] : []}
							variant={"bordered"}
							onChange={(e) => {
								setForm<NewRecurringForm>(
									"category_id",
									e.target.value ? Number(e.target.value) : null,
									validateErrors,
									setValidateErrors,
									setNewRecurring
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
							}}
							label={"Transaction Type"}
							value={newRecurring.direction}
							onValueChange={(e) => {
								setForm<NewRecurringForm>(
									"direction",
									e as TRecurringDirection,
									validateErrors,
									setValidateErrors,
									setNewRecurring
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
								aria-label={"Start Date"}
								label={"Start Date"}
								labelPlacement={"outside"}
								value={parseDate(moment(newRecurring.start_date).format("YYYY-MM-DD"))}
								variant={"bordered"}
								onChange={(e) =>
									setForm<NewRecurringForm>(
										"start_date",
										e?.toDate(getLocalTimeZone())?.toISOString() ?? moment().toISOString(),
										validateErrors,
										setValidateErrors,
										setNewRecurring
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
								selectedKeys={[newRecurring.frequency]}
								variant={"bordered"}
								onChange={(e) => {
									setForm<NewRecurringForm>(
										"frequency",
										e.target.value as TFrequencyType,
										validateErrors,
										setValidateErrors,
										setNewRecurring
									);
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
								placeholder={"Every X " + newRecurring.frequency}
								type={"number"}
								value={newRecurring.interval.toString()}
								variant={"bordered"}
								onValueChange={(value) =>
									setForm<NewRecurringForm>(
										"interval",
										Number(value) || 1,
										validateErrors,
										setValidateErrors,
										setNewRecurring
									)
								}
							/>
						</div>

						<DatePicker
							disableAnimation
							hideTimeZone
							showMonthAndYearPickers
							aria-label={"End Date (Optional)"}
							label={"End Date (Optional)"}
							labelPlacement={"outside"}
							minValue={parseDate(moment(newRecurring.start_date).add(1, 'day').format("YYYY-MM-DD"))}
							value={newRecurring.end_date ? parseDate(moment(newRecurring.end_date).format("YYYY-MM-DD")) : null}
							variant={"bordered"}
							onChange={(e) =>
								setForm<NewRecurringForm>(
									"end_date",
									e ? e.toDate(getLocalTimeZone())?.toISOString() : null,
									validateErrors,
									setValidateErrors,
									setNewRecurring
								)
							}
						/>

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
								value={newRecurring.amount.toString()}
								variant={"bordered"}
								onValueChange={(value) =>
									setForm<NewRecurringForm>(
										"amount",
										Number(value),
										validateErrors,
										setValidateErrors,
										setNewRecurring
									)
								}
							/>
							<div className={"flex items-center gap-1"}>
								{makeSuggestAmount(newRecurring.amount).map((val, index) => (
									<Chip
										key={index}
										classNames={{
											content: index === 0 && "font-semibold",
										}}
										color={index === 0 ? "primary" : "default"}
										size={"sm"}
										variant={"flat"}
										onClick={() =>
											setForm("amount", val, validateErrors, setValidateErrors, setNewRecurring)
										}
									>
										{index === 0 && "Current: "}
										{val.toLocaleString()}
									</Chip>
								))}
							</div>
						</div>

						<Textarea
							label={"Notes (Optional)"}
							labelPlacement={"outside"}
							minRows={3}
							placeholder={"Add notes about this recurring transaction"}
							value={newRecurring.notes}
							variant={"bordered"}
							onValueChange={(value) =>
								setForm<NewRecurringForm>(
									"notes",
									value,
									validateErrors,
									setValidateErrors,
									setNewRecurring
								)
							}
						/>
					</div>
				</CustomForm>
				<div
					className={
						"w-full xl:min-w-96 flex flex-col gap-2 border-b border-gray-200 pb-4 lg:pb-0 lg:border-b-0"
					}
				>
					<p className={"text-sm font-semibold text-center mb-2"}>Next {nextOccurrences.length} Occurrences</p>
					<Table
						className={"max-h-52 xl:max-h-full"}
						classNames={{
							wrapper: "bg-transparent shadow-none py-0 px-0",
						}}
					>
						<TableHeader>
							<TableColumn>Occurrence</TableColumn>
							<TableColumn align={"end"}>Date</TableColumn>
						</TableHeader>
						<TableBody>
							{nextOccurrences.map((date, index) => (
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
