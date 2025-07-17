"use client";

import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { ErrorObject } from "ajv";
import { Radio, RadioGroup } from "@heroui/radio";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";
import { Spinner } from "@heroui/spinner";
import { useRouter } from "next/navigation";

import { TCard, TUpdateCard } from "../../../../../types/card";

import CustomForm from "@/components/shared/form/custom-form";
import BankCard from "@/components/shared/bank-card/bank-card";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse, ListColors, TColor } from "@/types/global";
import { setForm } from "@/utils/set-form";
import { ListBankCode } from "@/configs/bank";
import { TBankCode } from "@/types/bank";
import { getFieldError } from "@/utils/get-field-error";
import useScreenSize from "@/hooks/useScreenSize";
import { BREAK_POINT } from "@/configs/break-point";

interface EditCardFormProps {
	cardId: string;
}

export default function EditCardForm({ cardId }: EditCardFormProps) {
	const router = useRouter();
	const { width } = useScreenSize();

	const [cardInfo, setCardInfo] = useState<TUpdateCard>({
		card_name: "",
		bank_code: "VIETCOMBANK",
		card_color: "red",
	});

	const [validationErrors, setValidationErrors] = useState<ErrorObject[]>([]);

	const {
		data: fetchCardInfoResult,
		loading: loadingCardInfo,
		error: fetchCardInfoError,
		fetch: fetchCardInfo,
		statusCode: fetchCardStatus,
	} = useFetch<IAPIResponse<TCard>>(`/cards/${cardId}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
		skip: true,
	});

	const {
		data: editCardResult,
		// loading: loadingEditCard,
		error: editCardError,
		fetch: editCard,
	} = useFetch<IAPIResponse<TCard>>(`/cards/${cardId}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: cardInfo,
		skip: true,
	});

	useEffect(() => {
		if (cardId) {
			fetchCardInfo();
		}
	}, [cardId]);

	useEffect(() => {
		if (fetchCardInfoResult && fetchCardInfoResult.results) {
			setCardInfo({
				card_name: fetchCardInfoResult.results.card_name,
				bank_code: fetchCardInfoResult.results.bank_code,
				card_color: fetchCardInfoResult.results.card_color,
			});
		}

		if (fetchCardInfoError) {
			const parseError = JSON.parse(fetchCardInfoError);

			if (parseError.validateErrors) {
				setValidationErrors(parseError.validateErrors);
			} else {
				addToast({
					title: "Error",
					description: parseError.message,
					color: "danger",
				});

				if (fetchCardStatus === 403) {
					return router.push("/settings/cards");
				}
			}
		}
	}, [fetchCardInfoResult, fetchCardInfoError]);

	useEffect(() => {
		if (editCardResult) {
			addToast({
				title: "Success",
				description: editCardResult.message,
				color: "success",
			});
		}

		if (editCardError) {
			if (JSON.parse(editCardError).validateErrors && Array.isArray(JSON.parse(editCardError).validateErrors)) {
				setValidationErrors(JSON.parse(editCardError).validateErrors);
			}

			if (JSON.parse(editCardError).status === "failure") {
				addToast({
					title: "Error",
					description: JSON.parse(editCardError).message,
					color: "danger",
				});
			}
		}
	}, [editCardResult, editCardError]);

	return (
		<div
			className={clsx({
				"col-span-10": width > BREAK_POINT.L,
				"col-span-12": width <= BREAK_POINT.L,
			})}
		>
			{loadingCardInfo || !fetchCardInfoResult ? (
				<div className={clsx("w-full flex justify-center p-8")}>
					<Spinner size={"lg"}>Fetching...</Spinner>
				</div>
			) : (
				<div className={"flex flex-wrap-reverse items-start gap-4"}>
					<div
						className={clsx("border-gray-200 ", {
							"w-1/2 border-r pr-4": width > BREAK_POINT.L,
							"w-full border-t pt-4": width <= BREAK_POINT.L,
						})}
					>
						<CustomForm
							className={"flex flex-col gap-4"}
							formId={"editCardForm"}
							loadingText={"Saving..."}
							submitButtonSize={"lg"}
							submitButtonText={"Save"}
							onSubmit={editCard}
						>
							<Input
								isRequired
								errorMessage={getFieldError(validationErrors, "card_name")?.message}
								isInvalid={!!getFieldError(validationErrors, "card_name")}
								label={"Card Name"}
								labelPlacement={"outside"}
								placeholder={"Enter card name"}
								size={"lg"}
								value={cardInfo.card_name}
								variant={"bordered"}
								onValueChange={(e) =>
									setForm<TUpdateCard>(
										"card_name",
										e,
										validationErrors,
										setValidationErrors,
										setCardInfo
									)
								}
							/>
							<Select
								isRequired
								errorMessage={getFieldError(validationErrors, "bank_code")?.message}
								isInvalid={!!getFieldError(validationErrors, "bank_code")}
								label={"Select Bank"}
								labelPlacement={"outside"}
								selectedKeys={[cardInfo.bank_code]}
								size={"lg"}
								value={cardInfo.bank_code}
								variant={"bordered"}
								onChange={(e) =>
									setForm<TUpdateCard>(
										"bank_code",
										e.target.value as TBankCode,
										validationErrors,
										setValidationErrors,
										setCardInfo
									)
								}
							>
								{ListBankCode.map((bank) => (
									<SelectItem key={bank.key}>{bank.value}</SelectItem>
								))}
							</Select>
							<RadioGroup
								isRequired
								classNames={{
									label: "text-dark",
								}}
								errorMessage={getFieldError(validationErrors, "card_color")?.message}
								isInvalid={!!getFieldError(validationErrors, "card_color")}
								label={"Select Card Color"}
								orientation="horizontal"
								size={"lg"}
								value={cardInfo.card_color}
								onValueChange={(value) =>
									setForm<TUpdateCard>(
										"card_color",
										value as TColor,
										validationErrors,
										setValidationErrors,
										setCardInfo
									)
								}
							>
								{ListColors.map((color) => (
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
						</CustomForm>
					</div>
					<div
						className={clsx({
							"w-full": width <= BREAK_POINT.L,
							"w-1/2": width > BREAK_POINT.L,
						})}
					>
						<BankCard
							bankCode={cardInfo.bank_code}
							cardBalance={fetchCardInfoResult?.results?.card_balance ?? 0}
							cardName={cardInfo.card_name}
							color={cardInfo.card_color}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
