"use client";

import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { Radio, RadioGroup } from "@heroui/radio";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { useFetch } from "hieutndev-toolkit";

import CustomForm from "@/components/shared/form/custom-form";
import BankCard from "@/components/shared/bank-card/bank-card";
import { IAPIResponse, LIST_COLORS, TColor } from "@/types/global";
import { getBankOptions } from "@/configs/bank";
import { TBankCode } from "@/types/bank";
import { getFieldError } from "@/utils/get-field-error";
import { TCard, TAddNewCard, TUpdateCard } from "@/types/card";
import { ZodCustomError } from "@/types/zod";
import LoadingBlock from "@/components/shared/loading-block/loading-block";
import { useCardEndpoint } from "@/hooks/useCardEndpoint";
import { SITE_CONFIG } from "@/configs/site-config";

interface CardFormProps {
	mode: "create" | "edit";
	cardId?: string;
	initialData?: TCard;
	onSuccess?: () => void;
}

type CardFormData = TAddNewCard | TUpdateCard;

export default function CardForm({ mode, cardId, onSuccess }: CardFormProps) {
	const { useAddNewCard, useUpdateCard } = useCardEndpoint();

	const [cardData, setCardData] = useState<CardFormData>({
		card_name: "",
		card_balance: 0,
		bank_code: "VIETCOMBANK",
		card_color: "red",
		card_number: "",
	});

	const [validateErrors, setValidateErrors] = useState<ZodCustomError[]>([]);
	const [createMoreCard, setCreateMoreCard] = useState<boolean>(false);

	// Fetch card info for edit mode
	const {
		data: fetchCardInfoResult,
		loading: fetchingCardInfo,
		error: fetchCardInfoError,
		fetch: fetchCardInfo,
	} = useFetch<IAPIResponse<TCard>>(cardId ? `/cards/${cardId}` : "", {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		skip: true,
	});

	const createHook = useAddNewCard(cardData as TAddNewCard);
	const updateHook = useUpdateCard(cardId ?? "", cardData as TUpdateCard);

	const {
		data: submitResult,
		loading: isSubmitting,
		error: submitError,
		fetch: submitForm,
	} = mode === "create" ? createHook : updateHook;

	// Fetch card info on mount in edit mode
	useEffect(() => {
		if (mode === "edit" && cardId) {
			fetchCardInfo();
		}
	}, [mode, cardId]);

	// Handle fetched card info
	useEffect(() => {
		if (fetchCardInfoResult && fetchCardInfoResult.results) {
			setCardData({
				card_name: fetchCardInfoResult.results.card_name,
				bank_code: fetchCardInfoResult.results.bank_code,
				card_color: fetchCardInfoResult.results.card_color,
				card_number: fetchCardInfoResult.results.card_number,
				card_balance: fetchCardInfoResult.results.card_balance,
			});
			setLoadingCardInfo(false);
		}

		if (fetchCardInfoError) {
			const parseError = JSON.parse(fetchCardInfoError);

			if (parseError.validateErrors) {
				setValidateErrors(parseError.validateErrors);
			} else {
				addToast({
					title: "Error",
					description: parseError.message,
					color: "danger",
				});
			}
		}
	}, [fetchCardInfoResult, fetchCardInfoError]);

	// Handle submit result
	useEffect(() => {
		if (submitResult) {
			addToast({
				title: "Success",
				description: submitResult.message,
				color: "success",
			});

			if (mode === "create" && createMoreCard) {
				resetForm();
			} else if (onSuccess) {
				onSuccess();
			}
		}

		if (submitError) {
			const parseError = JSON.parse(submitError);

			if (parseError.validateErrors && Array.isArray(parseError.validateErrors)) {
				setValidateErrors(parseError.validateErrors);
			} else {
				addToast({
					title: "Error",
					description: parseError.message,
					color: "danger",
				});
			}
		}
	}, [submitResult, submitError]);

	const resetForm = () => {
		setCardData({
			card_name: "",
			card_balance: 0,
			bank_code: "VIETCOMBANK",
			card_color: "red",
			card_number: "",
		});
		setValidateErrors([]);
	};

	const onChangeValue = <K extends keyof (TAddNewCard | TUpdateCard)>(key: K, value: any) => {
		if (getFieldError(validateErrors, key as string)) {
			setValidateErrors((prev) => prev.filter((error) => error.instancePath !== `${key}`));
		}

		setCardData((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const isLoading = mode === "edit" ? (fetchingCardInfo || isSubmitting) : isSubmitting;
	const loadingText = mode === "create" ? "Creating..." : "Saving...";
	const submitButtonText = mode === "create" ? "Create card" : "Save";

	const cardBalance =
		mode === "create"
			? (cardData as TAddNewCard).card_balance
			: (fetchCardInfoResult?.results?.card_balance ?? 0);

	return (
		<div className={"flex flex-col gap-4 lg:col-span-10 col-span-12"}>
			<div>
				{mode === "edit" && (fetchingCardInfo || !fetchCardInfoResult) ? (
					<LoadingBlock />
				) : (
					<div className={"w-full flex flex-wrap-reverse items-start gap-4 md:flex-nowrap"}>
						<div
							className={clsx(
								"border-gray-200 w-full border-t md:border-t-0 md:w-1/2 pt-4 md:pt-0 pr-0 md:pr-4 md:border-r"
							)}
						>
							<CustomForm
								className={"flex flex-col gap-4"}
								disableSubmitButton={mode === "create" && validateErrors.length > 0}
								formId={mode === "create" ? "addNewCardForm" : "editCardForm"}
								isLoading={isLoading}
								loadingText={loadingText}
								submitButtonSize={"lg"}
								submitButtonText={submitButtonText}
								onSubmit={submitForm}
							>
								<Input
									isRequired
									errorMessage={getFieldError(validateErrors, "card_name")?.message}
									isInvalid={!!getFieldError(validateErrors, "card_name")}
									label={"Card Name"}
									labelPlacement={"outside"}
									placeholder={"Enter card name"}
									size={"lg"}
									value={cardData.card_name}
									variant={"bordered"}
									onValueChange={(value) => onChangeValue("card_name", value)}
								/>
								<Input
									isRequired
									errorMessage={
										mode === "edit" && !cardData.card_number
											? "Missing card number, please fill in the card number."
											: getFieldError(validateErrors, "card_number")?.message
									}
									isInvalid={
										!!getFieldError(validateErrors, "card_number") ||
										(mode === "edit" && !cardData.card_number)
									}
									label={"Card Number"}
									labelPlacement={"outside"}
									placeholder={"Enter card number"}
									size={"lg"}
									value={cardData.card_number ?? ""}
									variant={"bordered"}
									onValueChange={(value) => onChangeValue("card_number", value)}
								/>
								{mode === "create" && (
									<Input
										isRequired
										endContent={SITE_CONFIG.CURRENCY_STRING}
										errorMessage={getFieldError(validateErrors, "card_balance")?.message}
										isInvalid={!!getFieldError(validateErrors, "card_balance")}
										label={"Current Balance"}
										labelPlacement={"outside"}
										size={"lg"}
										type={"number"}
										value={(cardData as TAddNewCard).card_balance.toString()}
										variant={"bordered"}
										onValueChange={(value) =>
											onChangeValue("card_balance", +value as any)
										}
									/>
								)}
								<Select
									isRequired
									disallowEmptySelection={true}
									errorMessage={getFieldError(validateErrors, "bank_code")?.message}
									isInvalid={!!getFieldError(validateErrors, "bank_code")}
									label={"Bank"}
									labelPlacement={"outside"}
									selectedKeys={[cardData.bank_code]}
									size={"lg"}
									value={cardData.bank_code}
									variant={"bordered"}
									onChange={(e) =>
										onChangeValue("bank_code", e.target.value as TBankCode)
									}
								>
									{getBankOptions.map((bank) => (
										<SelectItem key={bank.key}>{bank.value}</SelectItem>
									))}
								</Select>
								<RadioGroup
									isRequired
									classNames={{
										label: "text-dark",
									}}
									errorMessage={getFieldError(validateErrors, "card_color")?.message}
									isInvalid={!!getFieldError(validateErrors, "card_color")}
									label={"Select Card Color"}
									orientation="horizontal"
									size={"lg"}
									value={cardData.card_color}
									onValueChange={(value) =>
										onChangeValue("card_color", value as TColor)
									}
								>
									{LIST_COLORS.map((color) => (
										<Radio
											key={color}
											className={"capitalize"}
											classNames={{
												label: "flex items-center gap-1",
											}}
											value={color}
										>
											<div
												className={clsx(
													"w-6 h-6 bg-gradient-to-br rounded-md",
													`bankcard-${color}`
												)}
											/>
											{color}
										</Radio>
									))}
								</RadioGroup>
								{mode === "create" && (
									<>
										<Divider />
										<div className={"flex justify-end"}>
											<Checkbox
												isSelected={createMoreCard}
												onValueChange={setCreateMoreCard}
											>
												Create more cards?
											</Checkbox>
										</div>
									</>
								)}
							</CustomForm>
						</div>
						<div className={clsx("xl:w-96 md:w-1/2 w-full")}>
							<BankCard
								bankCode={cardData.bank_code}
								cardBalance={cardBalance}
								cardName={cardData.card_name}
								color={cardData.card_color}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

