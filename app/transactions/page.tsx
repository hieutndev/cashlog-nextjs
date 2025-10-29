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
import { useWindowSize } from "hieutndev-toolkit";
import moment from "moment";

import { useTransactionEndpoint } from "@/hooks/useTransactionEndpoint";
import { useCardEndpoint } from "@/hooks/useCardEndpoint";
import SingleTxnModal from "@/components/transactions/single-txn-modal";
import { FilterAndSortItem, IDataTable, IPagination } from "@/types/global";
import { useDebounce } from "@/hooks/useDebounce";
import ICONS from "@/configs/icons";
import { TCard } from "@/types/card";
import { getBankLogo } from "@/configs/bank";
import { BREAK_POINT } from "@/configs/break-point";
import { TTransaction, TTransactionWithCardAndCategory } from "@/types/transaction";
import { sliceText } from "@/utils/string";
import { SITE_CONFIG } from "@/configs/site-config";



export default function TransactionsPage() {
	const { width } = useWindowSize();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { useGetTransactions, useDeleteTransaction } = useTransactionEndpoint();
	const { useGetListCards } = useCardEndpoint();

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
	const txnParams = useMemo(() => ({
		page: currentPage,
		limit,
		search: debouncedSearchQuery.trim() || undefined,
		cardId: cardSelected || undefined,
		transactionType: transactionTypeSelected || undefined,
		sortBy: sortSelected || undefined,
	}), [currentPage, limit, debouncedSearchQuery, cardSelected, transactionTypeSelected, sortSelected]);

	const {
		data: allTxn,
		loading: retrievingTxn,
		fetch: getTxn,
	} = useGetTransactions(txnParams);

	useEffect(() => {
		getTxn();
	}, [txnParams]);

	const [dataTable, setDataTable] = useState<IDataTable<TTransactionWithCardAndCategory>>({
		columns: [
			{ key: "card_name", label: "Card" },
			{ key: "amount", label: "Amount" },
			{ key: "description", label: "Description" },
			{ key: "category_name", label: "Category" },
			{ key: "date", label: "Transaction Date" },
		],
		rows: [],
	});

	useEffect(() => {
		setCurrentPage(1);
	}, [sortSelected, cardSelected, transactionTypeSelected, debouncedSearchQuery]);

	useEffect(() => {
		if (allTxn && allTxn?.results) {
			const formattedData = allTxn.results.map((transaction) => ({
				...transaction,
				date: new Date(transaction.date).toLocaleString(),
			}));

			setDataTable((prev) => ({
				...prev,
				rows: formattedData,
			}));
		}

		if (allTxn?.pagination) {
			setPagination(allTxn.pagination);
		}
	}, [allTxn]);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
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
			params.set("page", "1");
		} else {
			params.delete("search");
		}

		router.push(`/transactions?${params.toString()}`);
	};

	const handleSortChange = (value: string) => {
		setSortSelected(value);
	};

	const handleCardFilterChange = (value: string) => {
		setCardSelected(value);
	};

	const handleTransactionTypeChange = (value: "out" | "in" | "") => {
		setTransactionTypeSelected(value);
	};

	const [cardOptions, setCardOptions] = useState<FilterAndSortItem[]>([]);

	const { data: allCards } = useGetListCards();

	useEffect(() => {
		setCardOptions(
			allCards?.results?.map((card: TCard) => ({
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
	}, [allCards]);

	const [selectedTxn, setSelectedTxn] = useState<TTransactionWithCardAndCategory | null>(null);

	const {
		data: deleteTxnResult,
		error: deleteTxnError,
		fetch: deleteTxn,
	} = useDeleteTransaction(selectedTxn?.transaction_id ?? -1);

	useEffect(() => {
		if (deleteTxnResult) {
			getTxn();
			addToast({
				title: "Success",
				description: deleteTxnResult.message,
				color: "success",
			});
			setSelectedTxn(null);
		}

		if (deleteTxnError) {
			addToast({
				title: "Error",
				description: JSON.parse(deleteTxnError).message,
				color: "danger",
			});
		}
	}, [deleteTxnResult, deleteTxnError]);

	useEffect(() => {
		if (selectedTxn) {
			deleteTxn();
		}
	}, [selectedTxn]);

	const { isOpen: isOpenModalAddSingleTxn, onOpen: onOpenModalAddSingleTxn, onOpenChange: onModalAddSingleTxnChange } = useDisclosure();

	const [defaultData, setDefaultData] = useState<TTransaction | null>(null);
	const [modalMode, setModalMode] = useState<"create" | "update">("create");

	const handleUpdateTxn = (item: TTransaction) => {
		setDefaultData(item);
		setModalMode("update");
		onOpenModalAddSingleTxn();
	};

	const handleAddTxn = () => {
		setDefaultData(null);
		setModalMode("create");
		onOpenModalAddSingleTxn();
	};


	return (
		<section className={"w-full flex flex-col gap-4 "}>
			<div
				className={clsx("flex gap-4 sm:flex-row sm:justify-between sm:items-center flex-col items-start")}
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
						startContent={ICONS.BULK.MD}
						variant={"light"}
						onPress={() => router.push("/transactions/add-multiple-transactions")}
					>
						{width < BREAK_POINT.MD ? "Add Multiple" : "Add Multiple Transactions"}
					</Button>
					<Button
						color={"primary"}
						startContent={ICONS.NEW.MD}
						variant={"solid"}
						onPress={handleAddTxn}
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
						items={cardOptions}
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
							items.map((item) => (
								<Chip
									key={item.key}
									className={"capitalize"}
									color={item.key === "in" ? "success" : "danger"}
									size={"sm"}
									variant={"flat"}
								>
									{item.rendered}
								</Chip>
							))
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
					emptyContent={dataTable.rows.length === 0 && retrievingTxn ? <Spinner size={"lg"}>Loading...</Spinner> : "No data"}
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
												{moment(getKeyValue(item, columnKey)).format("DD/MM/YYYY")}
											</TableCell>
										);

									case "action":
										const isInit = getKeyValue(item, "description") === "Auto-generated when creating a new card";

										if (isInit) {
											return <TableCell className={"min-w-max"}>&nbsp;</TableCell>;
										}

										return <TableCell className={"min-w-max"}>
											<Button
												isIconOnly
												color={"warning"}
												variant={"light"}
												onPress={() => handleUpdateTxn(item)}
											>
												{ICONS.EDIT.MD}
											</Button>
											<Button
												isIconOnly
												color={"danger"}
												variant={"light"}
												onPress={() => setSelectedTxn(item)}
											>
												{ICONS.TRASH.MD}
											</Button>
										</TableCell>
											;

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


			<SingleTxnModal
				defaultData={defaultData}
				isOpen={isOpenModalAddSingleTxn}
				mode={modalMode}
				onOpenChange={onModalAddSingleTxnChange}
				onSuccess={() => getTxn()}
			/>
		</section>
	);
}
