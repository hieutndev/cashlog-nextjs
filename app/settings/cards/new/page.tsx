"use client";

import { useEffect, useState } from "react";
import { Input } from "@heroui/input";
import { Radio, RadioGroup } from "@heroui/radio";
import clsx from "clsx";
import { Select, SelectItem } from "@heroui/select";
import { ErrorObject } from "ajv";
import { addToast } from "@heroui/toast";
import { Checkbox } from "@heroui/checkbox";
import { Divider } from "@heroui/divider";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { useFetch } from "hieutndev-toolkit";

import { TCreateNewCard } from "@/types/card";
import CustomForm from "@/components/shared/form/custom-form";
import { IAPIResponse, ListColors, TColor } from "@/types/global";
import BankCard from "@/components/shared/bank-card/bank-card";
import { ListBankCode } from "@/configs/bank";
import { TBankCode } from "@/types/bank";
import { getFieldError } from "@/utils/get-field-error";
import ICONS from "@/configs/icons";
import { SITE_CONFIG } from "@/configs/site-config";

export default function NewCardPage() {
	const router = useRouter();

	const [newCard, setNewCard] = useState<TCreateNewCard>({
		card_name: "",
		card_balance_init: 0,
		bank_code: "VIETCOMBANK",
		card_color: "red",
	});

	const [validateErrors, setValidateErrors] = useState<ErrorObject[]>([]);
	const [createMoreCard, setCreateMoreCard] = useState<boolean>(false);

	const {
		data,
		// loading,
		error,
		fetch: createCard,
	} = useFetch<IAPIResponse>("/cards", {
		method: "POST",
		body: newCard,
		headers: {
			"Content-Type": "application/json",
		},
		skip: true,
	});

	const resetForm = () => {
		setNewCard({
			card_name: "",
			card_balance_init: 0,
			bank_code: "VIETCOMBANK",
			card_color: "red",
		});
	};

	useEffect(() => {
		if (data) {
			addToast({
				title: "Success",
				description: data.message,
				color: "success",
			});
			if (createMoreCard) {
				resetForm();
			} else {
				router.push("/settings/cards");
			}
		}

		if (error) {
			const parsedError = JSON.parse(error) as IAPIResponse;

			if (parsedError.status === "failure") {
				addToast({
					title: "Error",
					description: parsedError.message,
					color: "danger",
				});
				if (parsedError.validateErrors) {
					setValidateErrors(parsedError.validateErrors);
				}
			}
		}
	}, [data, error]);

	const onChangeValue = <K extends keyof TCreateNewCard>(key: K, value: TCreateNewCard[K]) => {
		if (getFieldError(validateErrors, key)) {
			setValidateErrors((prev) => prev.filter((error) => error.instancePath !== `/${key}`));
		}

		setNewCard((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	return (
		<div className={"flex flex-col gap-4 col-span-12 lg:col-span-10"}>
			<div className={"flex items-center justify-between"}>
				<h3 className={"text-2xl font-semibold"}>New Card</h3>
				<Button
					color={"primary"}
					startContent={ICONS.BACK.MD}
					onPress={() => router.push("/settings/cards")}
				>
					Back
				</Button>
			</div>
			<div className={clsx("w-full flex items-start gap-4 flex-wrap-reverse md:flex-nowrap")}>
				<div
					className={clsx("border-gray-200 w-full border-t md:border-t-0 md:w-1/2 pt-4 md:pt-0 pr-0 md:pr-4 md:border-r")}
				>
					<CustomForm
						className={"flex flex-col gap-4"}
						disableSubmitButton={validateErrors.length > 0}
						formId={"addNewCardForm"}
						loadingText={"Creating..."}
						submitButtonSize={"lg"}
						submitButtonText={"Create card"}
						onSubmit={createCard}
					>
						<Input
							isRequired
							errorMessage={getFieldError(validateErrors, "card_name")?.message}
							isInvalid={!!getFieldError(validateErrors, "card_name")}
							label={"Card Name"}
							labelPlacement={"outside"}
							name={"card_name"}
							placeholder={"Enter card name..."}
							size={"lg"}
							value={newCard.card_name}
							variant={"bordered"}
							onValueChange={(value) => onChangeValue("card_name", value)}
						/>
						<Input
							isRequired
							endContent={SITE_CONFIG.CURRENCY_STRING}
							errorMessage={getFieldError(validateErrors, "card_balance_init")?.message}
							isInvalid={!!getFieldError(validateErrors, "card_balance_init")}
							label={"Current Balance"}
							labelPlacement={"outside"}
							size={"lg"}
							type={"number"}
							value={newCard.card_balance_init.toString()}
							variant={"bordered"}
							onValueChange={(value) => onChangeValue("card_balance_init", +value)}
						/>
						<Select
							isRequired
							disallowEmptySelection={true}
							label={"Select Bank"}
							labelPlacement={"outside"}
							selectedKeys={[newCard.bank_code]}
							size={"lg"}
							value={newCard.bank_code}
							variant={"bordered"}
							onChange={(e) => onChangeValue("bank_code", e.target.value as TBankCode)}
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
							label={"Select Card Color"}
							orientation="horizontal"
							size={"lg"}
							value={newCard.card_color}
							onValueChange={(value) => onChangeValue("card_color", value as TColor)}
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
										className={clsx("w-6 h-6 bg-gradient-to-br rounded-md", `bankcard-${color}`)}
									/>
									{color}
								</Radio>
							))}
						</RadioGroup>
						<Divider />
						<div className={"flex justify-end"}>
							<Checkbox
								isSelected={createMoreCard}
								onValueChange={setCreateMoreCard}
							>
								Create more cards?
							</Checkbox>
						</div>
					</CustomForm>
				</div>
				<div
					className={clsx("xl:w-96 md:w-1/2 w-full")}
				>
					<BankCard
						bankCode={newCard.bank_code}
						cardBalance={newCard.card_balance_init}
						cardName={newCard.card_name}
						color={newCard.card_color}
					/>
				</div>
			</div>
		</div>
	);
}
