import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { Button } from "@heroui/button";
import moment from "moment";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

import Container from "@/components/shared/container/container";
import { TCreateMultipleTransactionsResponse, TCrudTransaction, TImportFileXLSXResponse } from "@/types/transaction";
import { useFetch } from "@/hooks/useFetch";
import { TCard } from "@/types/card";
import { TCategory } from "@/types/category";
import { IAPIResponse } from "@/types/global";
import { formatDate } from "@/utils/date";
import ICONS from "@/configs/icons";

interface PreviewDataProps {
	uploadResult: TImportFileXLSXResponse;
	onCancelImport?: () => void;
}

export default function PreviewData({ uploadResult, onCancelImport }: PreviewDataProps) {
	/* FETCH USER's CATEGORIES */

	const {
		data: categoriesResult,
		error: categoriesError,
		loading: fetchingCategories,
	} = useFetch<IAPIResponse<TCategory[]>>("/categories");

	useEffect(() => {
		if (categoriesResult) {
			// Handle successful fetch of categories
		}

		if (categoriesError) {
			const parsedError = JSON.parse(categoriesError);

			addToast({
				title: "Error",
				description: parsedError.message,
			});
		}
	}, [categoriesResult, categoriesError]);

	/* FETCH USER's CARDS */

	const { data: cardsResult, error: cardsError, loading: fetchingCards } = useFetch<IAPIResponse<TCard[]>>("/cards");

	useEffect(() => {
		if (cardsResult) {
			// Handle successful fetch of cards
		}

		if (cardsError) {
			const parsedError = JSON.parse(cardsError);

			addToast({
				title: "Error",
				description: parsedError.message,
			});
		}
	}, [cardsResult, cardsError]);

	const [mappedData, setMappedData] = useState<TCrudTransaction[]>([]);

	const columns = [
		{ key: "date", label: "Date" },
		{ key: "direction", label: "Direction" },
		{ key: "amount", label: "Amount" },
		{ key: "description", label: "Description" },
		{ key: "category", label: "Category" },
		{ key: "card", label: "Card" },
	];

	useEffect(() => {
		const newData: TCrudTransaction[] = uploadResult.mapped_column_data.date.map((row, index) => ({
			date: moment(row).startOf("day").toISOString(),
			direction: uploadResult.mapped_column_data.direction[index],
			amount: Number(uploadResult.mapped_column_data.amount[index]),
			description: uploadResult.mapped_column_data.description[index],
			category_id:
				categoriesResult?.results?.find(
					(category) => category.category_name === uploadResult.mapped_column_data.category_name[index]
				)?.category_id ?? null,
			card_id:
				cardsResult?.results?.find(
					(card) => card.card_name === uploadResult.mapped_column_data.card_name[index]
				)?.card_id ?? 0,
		}));

		setMappedData(newData);
	}, [categoriesResult, cardsResult, uploadResult]);

	/* SUBMIT MAPPED DATA */

	const {
		data: createMultipleResult,
		error: createMultipleError,
		fetch: createMultiple,
	} = useFetch<IAPIResponse<TCreateMultipleTransactionsResponse>>(`/transactions/create-multiple`, {
		method: "POST",
		body: {
			list_transactions: mappedData,
		},
		skip: true,
	});

	useEffect(() => {
		if (createMultipleResult) {
			addToast({
				title: "Success",
				description: createMultipleResult.message,
			});
		}

		if (createMultipleError) {
			const parsedError = JSON.parse(createMultipleError);

			addToast({
				title: "Error",
				description: parsedError.message,
			});
		}
	}, [createMultipleResult, createMultipleError]);

	/* HELPER FUNCTION */

	const getCategoryValue = (categoryId: TCategory["category_id"]) => {
		return categoriesResult?.results?.find((category) => category.category_id === categoryId) ?? null;
	};

	const getCardValue = (cardId: TCard["card_id"]) => {
		return cardsResult?.results?.find((card) => card.card_id === cardId) ?? null;
	};

	return (
		<Container
			className={"!p-0"}
			gapSize={4}
			orientation={"vertical"}
		>
			<div className={"flex items-center gap-2"}>
				<h2 className={""}>
					<span className={"font-bold text-primary"}>{mappedData.length}</span> transactions will be imported
				</h2>
				<div className={"flex items-center gap-2"}>
					<Chip color={"success"}>{mappedData.filter((row) => row.direction === "in").length} Income</Chip>
					<Chip color={"danger"}>{mappedData.filter((row) => row.direction === "out").length} Expense</Chip>
					<Chip color={"secondary"}>
						{Array.from(new Set(mappedData.map((row) => row.category_id))).length} Categories
					</Chip>
					<Chip>{Array.from(new Set(mappedData.map((row) => row.card_id))).length} Cards</Chip>
				</div>
			</div>
			<Table
				isHeaderSticky
				className={"max-h-[70vh]"}
			>
				<TableHeader columns={columns}>
					{(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
				</TableHeader>
				<TableBody
					emptyContent={
						fetchingCards || fetchingCategories ? <Spinner>Mapping data...</Spinner> : "No data available"
					}
				>
					{mappedData &&
						mappedData.map((row, index) => (
							<TableRow key={index}>
								<TableCell className={"w-2/12"}>{formatDate(row.date, "onlyDate")}</TableCell>
								<TableCell className={"w-2/12"}>
									<Chip color={row.direction === "in" ? "success" : "danger"}>
										{row.direction === "in" ? "Income" : "Expense"}
									</Chip>
								</TableCell>
								<TableCell className={"w-2/12"}>{row.amount.toLocaleString()}</TableCell>
								<TableCell className={"w-4/12"}>{row.description}</TableCell>
								<TableCell className={"w-2/12"}>
									{row.category_id ? (
										<Chip
											classNames={{
												base: `background-${getCategoryValue(row.category_id)?.color} text-white`,
											}}
										>
											{getCategoryValue(row.category_id)?.category_name}
										</Chip>
									) : (
										""
									)}
								</TableCell>
								<TableCell className={"w-2/12"}>
									<Chip variant={"flat"}>
										{row.card_id ? getCardValue(row.card_id)?.card_name : ""}
									</Chip>
								</TableCell>
							</TableRow>
						))}
				</TableBody>
			</Table>
			<div className={"flex items-center gap-4"}>
				<Button
					className={"min-w-max"}
					
					disabled={mappedData.length === 0}
					size={"lg"}
					startContent={ICONS.XMARK.LG}
					variant={"flat"}
					onPress={onCancelImport}
				>
					Cancel
				</Button>
				<Button
					fullWidth
					color={"primary"}
					size={"lg"}
					startContent={ICONS.IMPORT.LG}
					onPress={() => createMultiple()}
				>
					Start Import
				</Button>
			</div>
		</Container>
	);
}
