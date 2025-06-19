"use client";

import { useEffect, useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
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

import CustomForm from "@/components/shared/form/custom-form";
import { ListTransactionType, TNewTransaction } from "@/types/transaction";
import TransactionType from "@/components/transactions/transaction-type";
import BankCardRadio, { AccountCardProps } from "@/components/shared/bank-card-radio/bank-card-radio";
import { IAPIResponse } from "@/types/global";
import { TCard } from "@/types/card";
import { useFetch } from "@/hooks/useFetch";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import { makeSuggestAmount } from "@/utils/make-suggest-amount";
import { TCategory } from "@/types/category";

interface AddTransactionModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export default function AddTransactionModal({ isOpen, onOpenChange, onSuccess }: AddTransactionModalProps) {
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
			setNewTransaction({
				...newTransaction,
				card_id:
					fetchCardsResult?.results && fetchCardsResult?.results[0]
						? fetchCardsResult.results[0].card_id
						: "",
			});
		}
	}, [fetchCardsResult, fetchCardsError]);

	// HANDLE CREATE NEW TRANSACTION
	const [newTransaction, setNewTransaction] = useState<TNewTransaction>({
		card_id: "",
		direction: "in",
		transaction_category: -1,
		transaction_date: new Date().toISOString(),
		transaction_type: "receive",
		transaction_amount: 0,
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
		body: newTransaction,
		skip: true,
	});

	const resetTransactionForm = () => {
		return setNewTransaction({
			card_id: listCard ? listCard[0]?.card_id : "",
			direction: "in",
			transaction_category: -1,
			transaction_date: new Date().toISOString(),
			transaction_type: "receive",
			transaction_amount: 0,
			description: "",
		});
	};

	useEffect(() => {
		if (createTransactionResult) {
			setListCard((prev) =>
				prev.map((card) => {
					if (card.card_id === newTransaction.card_id) {
						return {
							...card,
							card_balance:
								newTransaction.direction === "in"
									? card.card_balance + newTransaction.transaction_amount
									: card.card_balance - newTransaction.transaction_amount,
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
							<h2 className="text-xl font-semibold">Add New Transaction</h2>
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
											isLoading={creatingTransaction}
											submitButtonText={"Create Transaction"}
											onReset={resetTransactionForm}
											onSubmit={createTransaction}
										>
											<div className={"w-max flex flex-col gap-4"}>
												<RadioGroup
													classNames={{
														wrapper: "w-full flex gap-2",
													}}
													label={"From Account"}
													value={newTransaction.card_id.toString()}
													onValueChange={(e) =>
														setForm<TNewTransaction>(
															"card_id",
															+e,
															validateErrors,
															setValidateErrors,
															setNewTransaction
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
													value={newTransaction.transaction_type}
													onValueChange={(e) => {
														setForm<TNewTransaction>(
															"transaction_type",
															e,
															validateErrors,
															setValidateErrors,
															setNewTransaction
														);
														setForm<TNewTransaction>(
															"direction",
															["receive", "repay_received", "borrow"].includes(e)
																? "in"
																: "out",
															validateErrors,
															setValidateErrors,
															setNewTransaction
														);
													}}
												>
													{ListTransactionType.filter((value) => value !== "init").map(
														(type) => (
															<TransactionType
																key={type}
																type={type}
															/>
														)
													)}
												</RadioGroup>
												<div className={"flex items-center gap-4"}>
													<DatePicker
														disableAnimation
														hideTimeZone
														isRequired
														showMonthAndYearPickers
														aria-label={"Date"}
														className={"w-max"}
														label={"Transaction Date"}
														labelPlacement={"outside"}
														value={parseAbsoluteToLocal(newTransaction.transaction_date)}
														variant={"bordered"}
														onChange={(e) =>
															setForm(
																"transaction_date",
																e?.toDate()?.toISOString() ?? new Date().toISOString(),
																validateErrors,
																setValidateErrors,
																setNewTransaction
															)
														}
													/>
													<Select
														items={listCategories}
														label={"Select category"}
														labelPlacement={"outside"}
														placeholder={"Select category"}
														selectedKeys={[newTransaction.transaction_category.toString()]}
														variant={"bordered"}
														onChange={(e) =>
															setForm(
																"transaction_category",
																+e.target.value,
																validateErrors,
																setValidateErrors,
																setNewTransaction
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
														errorMessage={
															getFieldError(validateErrors, "transaction_amount")?.message
														}
														isInvalid={
															!!getFieldError(validateErrors, "transaction_amount")
														}
														label={"Amount"}
														labelPlacement={"outside"}
														placeholder={"Enter amount"}
														type={"number"}
														value={newTransaction.transaction_amount.toString()}
														variant={"bordered"}
														onValueChange={(e) =>
															setForm<TNewTransaction>(
																"transaction_amount",
																+e,
																validateErrors,
																setValidateErrors,
																setNewTransaction
															)
														}
													/>
													<div className={"flex items-center gap-1"}>
														{makeSuggestAmount(newTransaction.transaction_amount).map(
															(val, index) => (
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
																			"transaction_amount",
																			val,
																			validateErrors,
																			setValidateErrors,
																			setNewTransaction
																		)
																	}
																>
																	{index === 0 && "Current: "}
																	{val.toLocaleString()}
																</Chip>
															)
														)}
													</div>
												</div>
												<Textarea
													endContent={"VND"}
													label={"Description"}
													labelPlacement={"outside"}
													placeholder={"Enter description"}
													value={newTransaction.description.toString()}
													variant={"bordered"}
													onValueChange={(e) =>
														setForm<TNewTransaction>(
															"description",
															e,
															validateErrors,
															setValidateErrors,
															setNewTransaction
														)
													}
												/>
											</div>
										</CustomForm>
									) : (
										<Alert
											color={"danger"}
											title={"Please add at least one card before create new transaction"}
										/>
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
