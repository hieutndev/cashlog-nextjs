"use client";

import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { Radio, RadioGroup } from "@heroui/radio";
import { Select, SelectItem } from "@heroui/select";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { useFetch } from "hieutndev-toolkit";

import CustomForm from "@/components/shared/form/custom-form";
import BankCard from "@/components/shared/bank-card/bank-card";
import { IAPIResponse, LIST_COLORS, TColor } from "@/types/global";
import { setForm } from "@/utils/set-form";
import { ListBankCode } from "@/configs/bank";
import { TBankCode } from "@/types/bank";
import { getFieldError } from "@/utils/get-field-error";
import ICONS from "@/configs/icons";
import { TCard, TUpdateCard } from "@/types/card";
import { ZodCustomError } from "@/types/zod";
import LoadingBlock from "@/components/shared/loading-block/loading-block";

interface EditCardFormProps {
	cardId: string;
}

export default function EditCardForm({ cardId }: EditCardFormProps) {
	const router = useRouter();

	const [cardInfo, setCardInfo] = useState<TUpdateCard>({
		card_name: "",
		bank_code: "VIETCOMBANK",
		card_color: "red",
	});

	const [validationErrors, setValidationErrors] = useState<ZodCustomError[]>([]);

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
		<div className={"flex flex-col gap-4 lg:col-span-10 col-span-12"}>
			<div className={"flex items-center justify-between"}>
				<h3 className={"text-2xl font-semibold"}>Update Card</h3>
				<Button
					color={"primary"}
					startContent={ICONS.BACK.MD}
					onPress={() => router.push("/settings/cards")}
				>
					Back
				</Button>
			</div>
			<div>
				{loadingCardInfo || !fetchCardInfoResult ? (
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
							</CustomForm>
						</div>
						<div className={clsx("xl:w-96 md:w-1/2 w-full")}>
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
		</div>
	);
}
