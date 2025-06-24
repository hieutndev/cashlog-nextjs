"use client";

import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Select, SelectItem } from "@heroui/select";
import Image from "next/image";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { useDisclosure } from "@heroui/modal";

import AddTransactionModal from "./_component/add-transaction-modal";

import { IAPIResponse, IDataTable } from "@/types/global";
import { ListTransactionType, TFullTransaction } from "@/types/transaction";
import { useFetch } from "@/hooks/useFetch";
import SYS_ICONS from "@/configs/icons";
import { TCard } from "@/types/card";
import { getBankLogo } from "@/configs/bank";
import { BREAK_POINT } from "@/configs/break-point";
import useScreenSize from "@/hooks/useScreenSize";

type FilterAndSortItem = {
	key: string;
	label: string;
	startIcon?: React.ReactElement;
};

export default function TransactionsPage() {
	const { width } = useScreenSize();

	// HANDLE FETCH TRANSACTION

	const {
		data: fetchTransactionResults,
		loading: loadingTransactions,
		fetch: fetchTransactions,
	} = useFetch<IAPIResponse<TFullTransaction[]>>("/transactions");

	const [dataTable, setDataTable] = useState<IDataTable<TFullTransaction>>({
		columns: [
			{ key: "card_name", label: "Card" },
			{ key: "transaction_amount", label: "Amount" },
			{ key: "description", label: "Description" },
			{ key: "category_name", label: "Category" },
			{ key: "transaction_date", label: "Transaction Date" },
			{ key: "transaction_type", label: "Transaction Type" },
			// { key: "direction", label: "Direction" },
		],
		rows: [],
	});

	const sortSelection: FilterAndSortItem[] = [
		{
			key: "date_desc",
			label: "Newest First",
			startIcon: SYS_ICONS.DATE_DESC.MD,
		},
		{
			key: "date_asc",
			label: "Oldest First",
			startIcon: SYS_ICONS.DATE_ASC.MD,
		},
		{
			key: "amount_desc",
			label: "Highest Amount First",
			startIcon: SYS_ICONS.SORT_UP.MD,
		},
		{
			key: "amount_asc",
			label: "Lowest Amount First",
			startIcon: SYS_ICONS.SORT_DOWN.MD,
		},
	];

	const transactionTypeSelection: FilterAndSortItem[] = ListTransactionType.map((type) => ({
		key: type,
		label: type.replace("_", " "),
	}));

	const [sortSelected, setSortSelected] = useState("date_desc");
	const [cardSelected, setCardSelected] = useState("");
	const [transactionTypeSelected, setTransactionTypeSelected] = useState("");

	const onSelectFilterAndSort = () => {
		let filteredData = fetchTransactionResults?.results ?? [];

		if (cardSelected) {
			filteredData = filteredData.filter((transaction) => transaction.card_id.toString() === cardSelected);
		}

		if (transactionTypeSelected) {
			filteredData = filteredData.filter(
				(transaction) => transaction.transaction_type === transactionTypeSelected
			);
		}

		if (sortSelected) {
			switch (sortSelected) {
				case "date_desc":
					filteredData.sort(
						(a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
					);
					break;
				case "date_asc":
					filteredData.sort(
						(a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
					);
					break;
				case "amount_desc":
					filteredData.sort((a, b) => b.transaction_amount - a.transaction_amount);
					break;
				case "amount_asc":
					filteredData.sort((a, b) => a.transaction_amount - b.transaction_amount);
					break;
			}
		}

		setDataTable((prev) => ({
			...prev,
			rows: filteredData.map((transaction) => ({
				...transaction,
				transaction_date: new Date(transaction.transaction_date).toLocaleString(),
			})),
		}));
	};

	useEffect(() => {
		setDataTable((prev) => ({
			...prev,
			rows:
				fetchTransactionResults?.results?.map((transaction) => ({
					...transaction,
					transaction_date: new Date(transaction.transaction_date).toLocaleString(),
				})) ?? [],
		}));
	}, [fetchTransactionResults]);

	useEffect(() => {
		onSelectFilterAndSort();
	}, [fetchTransactionResults, sortSelected, cardSelected, transactionTypeSelected]);

	// HANDLE FETCH CARD

	const [listCards, setListCards] = useState<FilterAndSortItem[]>([]);

	const { data: fetchCardResults } = useFetch<IAPIResponse<TCard[]>>("/cards");

	useEffect(() => {
		setListCards(
			fetchCardResults?.results?.map((card) => ({
				key: card.card_id.toString(),
				label: card.card_name,
				startIcon: (
					<Image
						alt={`card ${card.card_id} bank logo`}
						className={"w-4"}
						height={1200}
						src={getBankLogo(card.bank_code, 1)}
						width={1200}
					/>
				),
			})) ?? []
		);
	}, [fetchCardResults]);

	// HANDLE DELETE TRANSACTION

	const [selectedDeleteTransactionId, setSelectedDeleteTransactionId] = useState<string | null>(null);

	const {
		data: deleteTransactionResults,
		// loading: deletingTransaction,
		error: errorDeleteTransaction,
		fetch: deleteTransaction,
	} = useFetch<IAPIResponse<TFullTransaction>>(
		"/transactions",
		{
			transactionId: selectedDeleteTransactionId,
		},
		{
			method: "DELETE",
			skip: true,
		}
	);

	useEffect(() => {
		if (deleteTransactionResults) {
			fetchTransactions();
			addToast({
				title: "Success",
				description: deleteTransactionResults.message,
				color: "success",
			});
			setSelectedDeleteTransactionId(null);
		}

		if (errorDeleteTransaction) {
			addToast({
				title: "Error",
				description: JSON.parse(errorDeleteTransaction).message,
				color: "danger",
			});
		}
	}, [deleteTransactionResults, errorDeleteTransaction]);

	useEffect(() => {
		if (selectedDeleteTransactionId) {
			deleteTransaction();
		}
	}, [selectedDeleteTransactionId]);

	// HANDLE OPEN NEW TRANSACTION MODAL

	const { isOpen, onOpen, onOpenChange } = useDisclosure();

	return (
		<section className={"w-full flex flex-col gap-4"}>
			<div
				className={clsx("flex gap-4", {
					"justify-between items-center": width > BREAK_POINT.S,
					"flex-col items-start": width <= BREAK_POINT.S,
				})}
			>
				<h3 className={"text-2xl font-semibold"}>Transaction History</h3>
				<Button
					color={"primary"}
					startContent={SYS_ICONS.NEW.LG}
					variant={"solid"}
					onPress={() => {
						onOpen();
					}}
				>
					New Transaction
				</Button>
			</div>
			<div className={"flex items-center justify-between gap-4"}>
				<div className={"flex items-start flex-wrap gap-4"}>
					<Select
						className={"w-60"}
						items={sortSelection}
						label={"Sort"}
						labelPlacement={"outside"}
						placeholder={"No Sort"}
						renderValue={(items) => (
							<div className="flex items-center gap-2">
								{items.map((item) => (
									<div
										key={item.key}
										className="flex items-center gap-1"
									>
										{item.props?.startContent}
										{item.rendered}
									</div>
								))}
							</div>
						)}
						selectedKeys={[sortSelected]}
						variant={"faded"}
						onChange={(e) => setSortSelected(e.target.value)}
					>
						{(item) => (
							<SelectItem
								key={item.key}
								startContent={item.startIcon}
							>
								{item.label}
							</SelectItem>
						)}
					</Select>
					<Select
						className={"w-56"}
						items={listCards}
						label={"Filter by card"}
						labelPlacement={"outside"}
						placeholder={"All Cards"}
						renderValue={(cards) => (
							<div className="flex items-center gap-2">
								{cards.map((card, index) => (
									<div
										key={index}
										className="flex items-center gap-1"
									>
										{card.props?.startContent}
										{card.rendered}
									</div>
								))}
							</div>
						)}
						selectedKeys={[cardSelected]}
						variant={"faded"}
						onChange={(e) => setCardSelected(e.target.value)}
					>
						{(card) => (
							<SelectItem
								key={card.key}
								startContent={card.startIcon}
							>
								{card.label}
							</SelectItem>
						)}
					</Select>

					<Select
						className={"w-60"}
						items={transactionTypeSelection}
						label={"Transaction type"}
						labelPlacement={"outside"}
						placeholder={"All Type"}
						renderValue={(items) => (
							<div className="flex items-center gap-2">
								{items.map((item) => (
									<div key={item.key}>{item.rendered}</div>
								))}
							</div>
						)}
						selectedKeys={[transactionTypeSelected]}
						variant={"faded"}
						onChange={(e) => setTransactionTypeSelected(e.target.value)}
					>
						{(item) => (
							<SelectItem key={item.key}>
								<Chip
									className={"px-1 capitalize"}
									color={
										["receive", "borrow", "repay_received"].includes(item.key)
											? "success"
											: "danger"
									}
									size={"sm"}
									variant={"flat"}
								>
									{item.label}
								</Chip>
							</SelectItem>
						)}
					</Select>
				</div>
			</div>
			{loadingTransactions ? (
				<div className={"flex items-center justify-center h-full"}>
					<Spinner size={"lg"}>Loading...</Spinner>
				</div>
			) : (
				<Table
					aria-label={"Transactions table"}
					className={clsx({
						"max-h-[70vh]": width > BREAK_POINT.XL,
						"max-h-screen": width <= BREAK_POINT.XL,
					})}
					selectionMode={"single"}
				>
					<TableHeader columns={[...dataTable.columns, { key: "action", label: "" }]}>
						{(column) => (
							<TableColumn
								key={column.key}
								align={["transaction_type", "category_name"].includes(column.key) ? "center" : "start"}
							>
								{column.label}
							</TableColumn>
						)}
					</TableHeader>
					<TableBody
						emptyContent={"No data"}
						items={dataTable.rows}
					>
						{(item) => (
							<TableRow
								key={item.transaction_id}
								className={clsx({
									"text-success": item.direction === "in",
									"text-danger": item.direction === "out",
								})}
							>
								{(columnKey) => {
									switch (columnKey) {
										case "card_name":
											return (
												<TableCell className={"capitalize"}>
													<div className={"flex items-center gap-2"}>
														<Image
															alt={`Logo bank`}
															className={"w-4"}
															height={1200}
															src={getBankLogo(getKeyValue(item, "bank_code"), 1)}
															width={1200}
														/>
														<p>{getKeyValue(item, columnKey)}</p>
													</div>
												</TableCell>
											);
										case "transaction_type":
											return (
												<TableCell className={"capitalize"}>
													{getKeyValue(item, columnKey).replace("_", " ")}
												</TableCell>
											);

										case "transaction_amount":
											return (
												<TableCell className={"capitalize"}>
													{`${item.direction === "in" ? "+" : "-"}${getKeyValue(item, columnKey).toLocaleString()} VND`}
												</TableCell>
											);
										case "category_name":
											return (
												<TableCell className={"capitalize"}>
													{getKeyValue(item, columnKey) ? (
														<Chip
															classNames={{
																base: `background-${getKeyValue(item, "category_color")} text-white`,
															}}
														>
															{getKeyValue(item, columnKey)}
														</Chip>
													) : (
														""
													)}
												</TableCell>
											);
										case "action":
											return (
												<TableCell>
													<Button
														isIconOnly
														color={"danger"}
														variant={"light"}
														onPress={() =>
															setSelectedDeleteTransactionId(item.transaction_id)
														}
													>
														{SYS_ICONS.TRASH.MD}
													</Button>
												</TableCell>
											);
										default:
											return (
												<TableCell
													className={clsx({
														capitalize: columnKey === "transaction_type",
													})}
												>
													{getKeyValue(item, columnKey)}
												</TableCell>
											);
									}
								}}
							</TableRow>
						)}
					</TableBody>
				</Table>
			)}
			<AddTransactionModal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				onSuccess={() => fetchTransactions()}
			/>
		</section>
	);
}
