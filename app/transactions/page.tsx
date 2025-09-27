"use client";

import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Select, SelectItem } from "@heroui/select";
import Image from "next/image";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { useDisclosure } from "@heroui/modal";
import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@heroui/pagination";
import { Input } from "@heroui/input";

import CrudTransactionModal from "./_component/transaction-form-modal";

import { IAPIResponse, IDataTable, IPagination } from "@/types/global";
import { useFetch } from "hieutndev-toolkit";
import { useDebounce } from "@/hooks/useDebounce";
import ICONS from "@/configs/icons";
import { TCard } from "@/types/card";
import { getBankLogo } from "@/configs/bank";
import { BREAK_POINT } from "@/configs/break-point";
import { useWindowSize } from "hieutndev-toolkit";
import { TTransaction, TTransactionWithCardAndCategory } from "@/types/transaction";
import { formatDate } from "@/utils/date";
import { sliceText } from "@/utils/string";
import { SITE_CONFIG } from "@/configs/site-config";

type FilterAndSortItem = {
	key: string;
	label: string;
	startIcon?: React.ReactElement;
};

export default function TransactionsPage() {
	const { width } = useWindowSize();
	const router = useRouter();
	const searchParams = useSearchParams();

	const sortSelection: FilterAndSortItem[] = [
		{
			key: "date_desc",
			label: "Newest First",
			startIcon: ICONS.DATE_DESC.MD,
		},
		{
			key: "date_asc",
			label: "Oldest First",
			startIcon: ICONS.DATE_ASC.MD,
		},
		{
			key: "amount_desc",
			label: "Highest Amount First",
			startIcon: ICONS.SORT_UP.MD,
		},
		{
			key: "amount_asc",
			label: "Lowest Amount First",
			startIcon: ICONS.SORT_DOWN.MD,
		},
	];

	const [currentPage, setCurrentPage] = useState<number>(() => {
		const page = searchParams.get("page");

		return page ? Math.max(1, parseInt(page, 10)) : 1;
	});
	const limit = 10;
	const [pagination, setPagination] = useState<IPagination>({
		page: 1,
		limit,
		total: 0,
		totalPages: 0,
	});

	const [searchQuery, setSearchQuery] = useState<string>(() => {
		return searchParams.get("search") || "";
	});
	const debouncedSearchQuery = useDebounce(searchQuery, 300);

	// Filter and sort state
	const [sortSelected, setSortSelected] = useState("date_desc");
	const [cardSelected, setCardSelected] = useState("");
	const [transactionTypeSelected, setTransactionTypeSelected] = useState<"out" | "in" | "">("");

	// HANDLE FETCH TRANSACTION
	const transactionUrl = useMemo(() => {
		const params = new URLSearchParams();

		params.set("page", currentPage.toString());
		params.set("limit", limit.toString());

		if (debouncedSearchQuery.trim()) {
			params.set("search", debouncedSearchQuery.trim());
		}

		if (cardSelected) {
			params.set("cardId", cardSelected);
		}

		if (transactionTypeSelected) {
			params.set("transactionType", transactionTypeSelected);
		}

		if (sortSelected) {
			params.set("sortBy", sortSelected);
		}

		return `/transactions?${params.toString()}`;
	}, [currentPage, limit, debouncedSearchQuery, cardSelected, transactionTypeSelected, sortSelected]);

	const {
		data: fetchTransactionResults,
		loading: fetchingTransactions,
		fetch: fetchTransactions,
	} = useFetch<IAPIResponse<TTransactionWithCardAndCategory[]>>(transactionUrl);

	// Fetch data when URL changes
	useEffect(() => {
		fetchTransactions();
	}, [transactionUrl]);

	const [dataTable, setDataTable] = useState<IDataTable<TTransactionWithCardAndCategory>>({
		columns: [
			{ key: "card_name", label: "Card" },
			{ key: "amount", label: "Amount" },
			{ key: "description", label: "Description" },
			{ key: "category_name", label: "Category" },
			{ key: "date", label: "Transaction Date" },
			// { key: "direction", label: "Transaction Type" },
			// { key: "direction", label: "Direction" },
		],
		rows: [],
	});

	// Reset to page 1 when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [sortSelected, cardSelected, transactionTypeSelected, debouncedSearchQuery]);

	// Update data table when fetch results change
	useEffect(() => {
		if (fetchTransactionResults?.results) {
			const formattedData = fetchTransactionResults.results.map((transaction) => ({
				...transaction,
				date: new Date(transaction.date).toLocaleString(),
			}));

			setDataTable((prev) => ({
				...prev,
				rows: formattedData,
			}));
		}

		if (fetchTransactionResults?.pagination) {
			console.log("fetchTransactionResults.pagination", fetchTransactionResults.pagination);
			setPagination(fetchTransactionResults.pagination);
		}
	}, [fetchTransactionResults]);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);

		// Update URL to preserve current state
		const params = new URLSearchParams(searchParams.toString());
		
		params.set("page", page.toString());

		if (debouncedSearchQuery.trim()) {
			params.set("search", debouncedSearchQuery.trim());
		} else {
			params.delete("search");
		}

		router.push(`/transactions?${params.toString()}`);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value);

		const params = new URLSearchParams(searchParams.toString());

		if (value.trim()) {
			params.set("search", value.trim());
			params.set("page", "1"); // Reset to page 1 when searching
		} else {
			params.delete("search");
		}

		router.push(`/transactions?${params.toString()}`);
	};

	const handleSortChange = (value: string) => {
		setSortSelected(value);
		// Page will be reset to 1 by the useEffect hook
	};

	const handleCardFilterChange = (value: string) => {
		setCardSelected(value);
		// Page will be reset to 1 by the useEffect hook
	};

	const handleTransactionTypeChange = (value: "out" | "in" | "") => {
		setTransactionTypeSelected(value);
		// Page will be reset to 1 by the useEffect hook
	};

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
	const [selectedTransaction, setSelectedTransaction] = useState<TTransactionWithCardAndCategory | null>(null);

	const {
		data: deleteTransactionResults,
		error: errorDeleteTransaction,
		fetch: deleteTransaction,
	} = useFetch<IAPIResponse>(`/transactions?transactionId=${selectedTransaction?.transaction_id ?? -1}`, {
		method: "DELETE",
		skip: true,
	});

	useEffect(() => {
		if (deleteTransactionResults) {
			fetchTransactions();
			addToast({
				title: "Success",
				description: deleteTransactionResults.message,
				color: "success",
			});
			setSelectedTransaction(null);
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
		if (selectedTransaction) {
			deleteTransaction();
		}
	}, [selectedTransaction]);

	// HANDLE OPEN NEW TRANSACTION MODAL

	const { isOpen, onOpen, onOpenChange } = useDisclosure();

	// HANDLE OPEN UPDATE TRANSACTION MODAL

	const [defaultData, setDefaultData] = useState<TTransaction | null>(null);
	const [modalMode, setModalMode] = useState<"create" | "update">("create");

	const handleUpdate = (item: TTransaction) => {
		setDefaultData(item);
		setModalMode("update");
		onOpen();
	};

	const handleCreateTransaction = () => {
		setDefaultData(null);
		setModalMode("create");
		onOpen();
	};

	return (
		<section className={"w-full flex flex-col gap-4"}>
			<div
				className={clsx("flex gap-4", {
					"justify-between items-center": width > BREAK_POINT.SM,
					"flex-col items-start": width <= BREAK_POINT.SM,
				})}
			>
				<h3 className={"text-2xl font-semibold"}>Transaction History</h3>
				<div className={"flex items-center gap-2 md:flex-wrap md:flex-row flex-row-reverse"}>
					<Button
						color={"primary"}
						startContent={ICONS.IMPORT.LG}
						variant={"light"}
						onPress={() => router.push("/transactions/import-transactions")}
					>
						{width < BREAK_POINT.MD ? "Import" : "Import from Excel"}
					</Button>
					<Button
						color={"primary"}
						startContent={ICONS.NEW.MD}
						variant={"solid"}
						onPress={handleCreateTransaction}
					>
						New Transaction
					</Button>
				</div>
			</div>

			<div className={"flex items-center justify-between flex-wrap gap-4"}>
				<div className={"w-full lg:w-max flex items-start flex-wrap gap-4"}>
					<Select
						className={"w-full lg:w-60"}
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
						onChange={(e) => handleSortChange(e.target.value)}
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
						className={"w-full lg:w-60"}
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
						onChange={(e) => handleCardFilterChange(e.target.value)}
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
						className={"w-full lg:w-60"}
						items={[
							{
								key: "in",
								value: "In",
							},
							{
								key: "out",
								value: "Out",
							},
						]}
						label={"Transaction type"}
						labelPlacement={"outside"}
						placeholder={"All Type"}
						renderValue={(items) => (
							<div className="flex items-center gap-2">
								{items.map((item) => (
									<Chip
										key={item.key}
										className={"px-1 capitalize"}
										color={item.key === "in" ? "success" : "danger"}
										size={"sm"}
										variant={"flat"}
									>
										{item.rendered}
									</Chip>
								))}
							</div>
						)}
						selectedKeys={[transactionTypeSelected]}
						variant={"faded"}
						onChange={(e) => handleTransactionTypeChange(e.target.value as "out" | "in" | "")}
					>
						{(item) => (
							<SelectItem key={item.key}>
								<Chip
									className={"px-1 capitalize"}
									color={item.key === "in" ? "success" : "danger"}
									size={"sm"}
									variant={"flat"}
								>
									{item.value}
								</Chip>
							</SelectItem>
						)}
					</Select>
				</div>
				<Input
					isClearable
					className={"w-full xl:w-72"}
					label={"Search"}
					labelPlacement={"outside"}
					placeholder="Enter what you want to search..."
					startContent={ICONS.SEARCH.MD}
					value={searchQuery}
					variant={"bordered"}
					onClear={() => handleSearchChange("")}
					onValueChange={handleSearchChange}
				/>
			</div>
			{fetchingTransactions ? (
				<div
					className={
						"flex items-center justify-center h-[70vh] bg-white shadow-sm rounded-xl border border-gray-100"
					}
				>
					<Spinner size={"lg"}>Loading...</Spinner>
				</div>
			) : (
				<>
					<Table
						isHeaderSticky
						aria-label={"Transactions table"}
						bottomContent={
							width >= BREAK_POINT.MD &&
							pagination.totalPages > 1 && (
								<div className="flex justify-center mt-4">
									<Pagination
										showControls
										showShadow
										color="primary"
										page={pagination.page}
										total={pagination.totalPages}
										onChange={handlePageChange}
									/>
								</div>
							)
						}
						className={clsx("xl:h-[80vh] h-full")}
						selectionMode={"single"}
					>
						<TableHeader columns={[...dataTable.columns, { key: "action", label: "" }]}>
							{(column) => (
								<TableColumn
									key={column.key}
									align={
										["category_name", "date", "amount"].includes(column.key) ? "center" : "start"
									}
								>
									{column.label}
								</TableColumn>
							)}
						</TableHeader>
						<TableBody
							emptyContent={fetchingTransactions ? <Spinner size={"lg"}>Loading...</Spinner> : "No data"}
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
													<TableCell className={"capitalize min-w-max"}>
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

											case "amount":
												return (
													<TableCell className={"capitalize min-w-max"}>
														{`${item.direction === "in" ? "+" : "-"}${getKeyValue(item, columnKey).toLocaleString()}${SITE_CONFIG.CURRENCY_STRING}`}
													</TableCell>
												);

											case "description":
												return (
													<TableCell className={"min-w-max text-wrap"}>
														{sliceText(getKeyValue(item, columnKey), 30)}
													</TableCell>
												);

											case "category_name":
												return (
													<TableCell className={"capitalize min-w-max"}>
														{getKeyValue(item, columnKey) ? (
															<Chip
																classNames={{
																	base: `background-${getKeyValue(item, "category_color")} text-white w-max h-max px-2 py-1.5`,
																	content: `ellipsis max-w-[20ch]`,
																}}
															>
																{sliceText(getKeyValue(item, columnKey), 20)}
															</Chip>
														) : (
															""
														)}
													</TableCell>
												);

											case "date":
												return (
													<TableCell className={"min-w-max capitalize text-center"}>
														{formatDate(getKeyValue(item, columnKey), "onlyDate")}
													</TableCell>
												);

											case "action":
												return (
													<TableCell className={"min-w-max"}>
														<Button
															isIconOnly
															color={"warning"}
															variant={"light"}
															onPress={() => handleUpdate(item)}
														>
															{ICONS.EDIT.MD}
														</Button>
														<Button
															isIconOnly
															color={"danger"}
															variant={"light"}
															onPress={() => setSelectedTransaction(item)}
														>
															{ICONS.TRASH.MD}
														</Button>
													</TableCell>
												);

											default:
												return <TableCell>{getKeyValue(item, columnKey)}</TableCell>;
										}
									}}
								</TableRow>
							)}
						</TableBody>
					</Table>
					{width < BREAK_POINT.MD && pagination.totalPages > 1 && (
						<div className="flex justify-center mt-4">
							<Pagination
								showControls
								showShadow
								color="primary"
								page={pagination.page}
								total={pagination.totalPages}
								onChange={handlePageChange}
							/>
						</div>
					)}
				</>
			)}

			<CrudTransactionModal
				defaultData={defaultData}
				isOpen={isOpen}
				mode={modalMode}
				onOpenChange={onOpenChange}
				onSuccess={() => fetchTransactions()}
			/>
		</section>
	);
}
