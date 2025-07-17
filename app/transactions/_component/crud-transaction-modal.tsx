"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { Input, Textarea } from "@heroui/input";
import { RadioGroup } from "@heroui/radio";
import { Skeleton } from "@heroui/skeleton";
import { Alert } from "@heroui/alert";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { DatePicker } from "@heroui/date-picker";
import { ErrorObject } from "ajv";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { addToast } from "@heroui/toast";
import { Chip } from "@heroui/chip";
import clsx from "clsx";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import CustomForm from "@/components/shared/form/custom-form";
import { TCrudTransaction as TCrudTransaction, TTransaction } from "@/types/transaction";
import TransactionType from "@/components/transactions/transaction-type";
import BankCardRadio, { AccountCardProps } from "@/components/shared/bank-card-radio/bank-card-radio";
import { IAPIResponse } from "@/types/global";
import { TCard } from "@/types/card";
import { useFetch } from "@/hooks/useFetch";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import { makeSuggestAmount } from "@/utils/make-suggest-amount";
import { TCategory } from "@/types/category";
import ICONS from "@/configs/icons";
import { BREAK_POINT } from "@/configs/break-point";
import useScreenSize from "@/hooks/useScreenSize";

interface CrudTransactionModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
	defaultData?: TTransaction | null;
	mode?: "create" | "update";
}

export default function CrudTransactionModal({
	isOpen,
	onOpenChange,
	onSuccess,
	defaultData,
	mode = "create",
}: CrudTransactionModalProps) {
	const router = useRouter();
	const { width } = useScreenSize();

	// HANDLE FETCH CARD
	const [listCard, setListCard] = useState<AccountCardProps[]>([]);

	const {
		data: fetchCardsResult,
		loading: loadingCards,
		error: fetchCardsError,
		fetch: fetchCards,
	} = useFetch<IAPIResponse<TCard[]>>("/cards", {
		skip: true,
	});

	useEffect(() => {
		if (fetchCardsResult) {
			setListCard(fetchCardsResult.results ?? []);

			if (transactionInfo.card_id === 0 && fetchCardsResult.results ) {
			setTransactionInfo({
				...transactionInfo,
				card_id: fetchCardsResult?.results[0] ? fetchCardsResult.results[0].card_id : 0,
			});
			}
		}
	}, [fetchCardsResult, fetchCardsError]);

	// HANDLE CREATE NEW TRANSACTION
	const [transactionInfo, setTransactionInfo] = useState<TCrudTransaction>({
		card_id: 0,
		direction: "in",
		category_id: null,
		date: new Date().toISOString(),
		amount: 0,
		description: "",
	});

	const [validateErrors, setValidateErrors] = useState<ErrorObject[]>([]);

	const {
		data: createTransactionResult,
		loading: creatingTransaction,
		error: createTransactionError,
		fetch: createTransaction,
	} = useFetch<IAPIResponse>("/transactions", {
		method: "POST",
		body: transactionInfo,
		skip: true,
	});

	const {
		data: updateTransactionResult,
		loading: updatingTransaction,
		error: updateTransactionError,
		fetch: updateTransaction,
	} = useFetch<IAPIResponse>(`/transactions/${defaultData?.transaction_id ?? ""}`, {
		method: "PUT",
		body: transactionInfo,
		skip: true,
	});

	useEffect(() => {
		if (updateTransactionResult) {
			addToast({
				color: "success",
				title: "Success",
				description: updateTransactionResult.message,
			});
			resetTransactionForm();

			// Close modal and call success callback
			onOpenChange(false);
			if (onSuccess) {
				onSuccess();
			}
		}

		if (updateTransactionError) {
			const parseError = JSON.parse(updateTransactionError);

			if (parseError.validateErrors) {
				setValidateErrors(parseError.validateErrors);
			} else {
				addToast({
					color: "danger",
					title: "Error",
					description: parseError.message,
				});
			}
		}
	}, [updateTransactionResult, updateTransactionError]);

	const resetTransactionForm = () => {
		return setTransactionInfo({
			card_id: listCard ? listCard[0]?.card_id : 0,
			direction: "in",
			category_id: -1,
			date: new Date().toISOString(),
			amount: 0,
			description: "",
		});
	};

	useEffect(() => {
		if (createTransactionResult) {
			setListCard((prev) =>
				prev.map((card) => {
					if (card.card_id === transactionInfo.card_id) {
						return {
							...card,
							card_balance:
								transactionInfo.direction === "in"
									? card.card_balance + transactionInfo.amount
									: card.card_balance - transactionInfo.amount,
						};
					}

					return card;
				})
			);

			addToast({
				color: "success",
				title: "Success",
				description: createTransactionResult.message,
			});
			resetTransactionForm();

			// Close modal and call success callback
			onOpenChange(false);
			if (onSuccess) {
				onSuccess();
			}
		}

		if (createTransactionError) {
			const parseError = JSON.parse(createTransactionError);

			if (parseError.validateErrors) {
				setValidateErrors(parseError.validateErrors);
			} else {
				addToast({
					color: "danger",
					title: "Error",
					description: parseError.message,
				});
			}
		}
	}, [createTransactionResult, createTransactionError]);

	// HANDLE FETCH TRANSACTION CATEGORY
	const [listCategories, setListCategories] = useState<TCategory[]>([]);

	const {
		data: fetchCategoriesResult,
		error: fetchCategoriesError,
		fetch: fetchCategories,
		// loading: fetchingCategories,
	} = useFetch<IAPIResponse<TCategory[]>>("/categories", {
		skip: true,
	});

	useEffect(() => {
		if (fetchCategoriesResult) {
			setListCategories(fetchCategoriesResult.results ?? []);
		}

		if (fetchCategoriesError) {
			addToast({
				title: "Error",
				description: JSON.parse(fetchCategoriesError).message,
				color: "danger",
			});
		}
	}, [fetchCategoriesResult, fetchCategoriesError]);

	// HANLDE OPEN ISOPEN CHANGE STATE
	useEffect(() => {
		if (isOpen) {
			fetchCards();
			fetchCategories();
		}

		if (!isOpen) {
			resetTransactionForm();
		}
	}, [isOpen]);

	/* HANDLE CREATE TRANSACTION */

	const handleCreateTransaction = () => {
		return createTransaction({
			body: {
				...transactionInfo,
				category_id: transactionInfo.category_id === -1 ? null : transactionInfo.category_id,
			},
		});
	};

	/* HANDLE UPDATE TRANSACTION */

	const handleUpdateTransaction = () => {
		return updateTransaction({
			body: {
				...transactionInfo,
				category_id: transactionInfo.category_id === -1 ? null : transactionInfo.category_id,
			},
		});
	};

	/* HANDLE MAP DEFAULT DATA */

	useEffect(() => {
		if (defaultData) {
			console.log("🚀 ~ useEffect ~ defaultData:", defaultData)
			
			setTransactionInfo({
				card_id: defaultData.card_id,
				direction: defaultData.direction,
				category_id: defaultData.category_id,
				date: new Date(defaultData.date).toISOString(),
				amount: defaultData.amount,
				description: defaultData.description,
			});
		}
	}, [defaultData]);

	return (
		<Modal
			isDismissable={false}
			isOpen={isOpen}
			placement="center"
			scrollBehavior="inside"
			size="4xl"
			onOpenChange={onOpenChange}
		>
			<ModalContent>
				{() => (
					<>
						<ModalHeader className="flex items-center justify-between">
							<h6 className="text-xl font-semibold">Add New Transaction</h6>
						</ModalHeader>
						<ModalBody>
							<section className={"flex flex-col gap-4"}>
								<div className={clsx("w-full flex justify-center gap-2")}>
									{loadingCards ? (
										<Spinner>Fetching...</Spinner>
									) : listCard.length > 0 ? (
										<CustomForm
											resetButtonIcon
											className={"w-full flex h-max gap-4 flex-col"}
											formId={"newTransaction"}
											isLoading={mode === "create" ? creatingTransaction : updatingTransaction}
											submitButtonText={`${mode === "create" ? "Create" : "Update"} Transaction`}
											onReset={resetTransactionForm}
											onSubmit={
												mode === "create" ? handleCreateTransaction : handleUpdateTransaction
											}
										>
											<div className={"w-max flex flex-col gap-4"}>
												<RadioGroup
													classNames={{
														wrapper: "w-full flex gap-2",
													}}
													label={"From Account"}
													value={transactionInfo.card_id.toString()}
													onValueChange={(e) =>
														setForm<TCrudTransaction>(
															"card_id",
															+e,
															validateErrors,
															setValidateErrors,
															setTransactionInfo
														)
													}
												>
													<ScrollShadow
														hideScrollBar
														className={"flex flex-col gap-2 max-h-84"}
													>
														{loadingCards ? (
															<Skeleton
																className={
																	"w-96 h-14 rounded-2xl flex justify-start items-center"
																}
															/>
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
											</div>
											<div className={"w-full flex flex-col gap-4"}>
												<RadioGroup
													isRequired
													classNames={{
														wrapper: "flex flex-row items-center gap-2",
													}}
													label={"Transaction Type"}
													value={transactionInfo.direction}
													onValueChange={(e) => {
														setForm<TCrudTransaction>(
															"direction",
															e,
															validateErrors,
															setValidateErrors,
															setTransactionInfo
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
												<div
													className={clsx("flex items-center gap-4", {
														"flex-wrap": width <= BREAK_POINT.S,
													})}
												>
													<DatePicker
														disableAnimation
														hideTimeZone
														isRequired
														showMonthAndYearPickers
														aria-label={"Date"}
														className={"w-max"}
														label={"Transaction Date"}
														labelPlacement={"outside"}
														value={parseAbsoluteToLocal(transactionInfo.date)}
														variant={"bordered"}
														onChange={(e) =>
															setForm(
																"date",
																e?.toDate()?.toISOString() ?? new Date().toISOString(),
																validateErrors,
																setValidateErrors,
																setTransactionInfo
															)
														}
													/>
													<Select
														classNames={{
															mainWrapper: "w-64",
														}}
														items={listCategories}
														label={"Select category"}
														labelPlacement={"outside"}
														placeholder={"Select category"}
														selectedKeys={[transactionInfo.category_id?.toString() ?? 0]}
														variant={"bordered"}
														onChange={(e) =>
															setForm(
																"category_id",
																+e.target.value,
																validateErrors,
																setValidateErrors,
																setTransactionInfo
															)
														}
													>
														{(category) => (
															<SelectItem
																key={category.category_id}
																textValue={category.category_name}
															>
																{category.category_name}
															</SelectItem>
														)}
													</Select>
												</div>
												<div className={"flex flex-col gap-2"}>
													<Input
														isRequired
														endContent={"VND"}
														errorMessage={getFieldError(validateErrors, "amount")?.message}
														isInvalid={!!getFieldError(validateErrors, "amount")}
														label={"Amount"}
														labelPlacement={"outside"}
														placeholder={"Enter amount"}
														type={"number"}
														value={transactionInfo.amount.toString()}
														variant={"bordered"}
														onValueChange={(e) =>
															setForm<TCrudTransaction>(
																"amount",
																+e,
																validateErrors,
																setValidateErrors,
																setTransactionInfo
															)
														}
													/>
													<div className={"flex items-center gap-1"}>
														{makeSuggestAmount(transactionInfo.amount).map((val, index) => (
															<Chip
																key={index}
																classNames={{
																	content: index === 0 && "font-semibold",
																}}
																color={index === 0 ? "primary" : "default"}
																size={"sm"}
																variant={"flat"}
																onClick={() =>
																	setForm(
																		"amount",
																		val,
																		validateErrors,
																		setValidateErrors,
																		setTransactionInfo
																	)
																}
															>
																{index === 0 && "Current: "}
																{val.toLocaleString()}
															</Chip>
														))}
													</div>
												</div>
												<Textarea
													endContent={"VND"}
													label={"Description"}
													labelPlacement={"outside"}
													placeholder={"Enter description"}
													value={transactionInfo.description.toString()}
													variant={"bordered"}
													onValueChange={(e) =>
														setForm<TCrudTransaction>(
															"description",
															e,
															validateErrors,
															setValidateErrors,
															setTransactionInfo
														)
													}
												/>
											</div>
										</CustomForm>
									) : (
										<div className={"flex flex-col items-center gap-4"}>
											<Alert
												color={"danger"}
												title={"Please add at least one card before create new transaction"}
											/>
											<Button
												color={"primary"}
												startContent={ICONS.NEW.SM}
												onPress={() => {
													router.push("/settings/cards/new");
												}}
											>
												Create new card
											</Button>
										</div>
									)}
								</div>
							</section>
						</ModalBody>
						<ModalFooter />
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
