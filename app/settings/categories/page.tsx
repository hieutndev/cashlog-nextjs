"use client";

import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/table";
import { useEffect, useState } from "react";
import { addToast } from "@heroui/toast";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";

import CategoryForm from "./_component/category-form";

import { TCategory } from "@/types/category";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import SYS_ICONS from "@/config/icons";

const categoryColumns = [
	{ key: "category_name", label: "Category" },
	{ key: "action", label: "Action" },
];

export default function CategoriesPage() {
	const [categories, setCategories] = useState<TCategory[]>([]);

	const [formAction, setFormAction] = useState<"add" | "edit">("add");
	const [selectedCategory, setSelectedCategory] = useState<TCategory | undefined>(undefined);

	const {
		data: fetchCategoriesResult,
		// loading: fetchingCategories,
		error: fetchCategoriesError,
		fetch: fetchCategories,
	} = useFetch<IAPIResponse<TCategory[]>>(`/categories`);

	const onSuccess = async () => {
		await fetchCategories();
		setFormAction("add");
	};

	const onEdit = (category: TCategory) => {
		setFormAction("edit");
		setSelectedCategory(category);
	};

	const onDelete = (categoryId: string | number) => {
		fetch(`/api/categories/${categoryId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then(async (response) => {
				if (response.status === "success") {
					addToast({
						title: "Success",
						description: "Category deleted successfully.",
						color: "success",
					});
					await fetchCategories();
				} else {
					addToast({
						title: "Error",
						description: response.message || "An error occurred while deleting the category.",
						color: "danger",
					});
				}
			});
	};

	useEffect(() => {
		if (fetchCategoriesResult) {
			setCategories(fetchCategoriesResult.results ?? []);
		}

		if (fetchCategoriesError) {
			const parseError = JSON.parse(fetchCategoriesError);

			addToast({
				title: "Error",
				description: parseError.message || "An error occurred while fetching categories.",
				color: "danger",
			});
		}
	}, [fetchCategoriesResult, fetchCategoriesError]);

	return (
		<div className={"grid grid-cols-6 gap-4"}>
			<div className="col-span-4 flex flex-col gap-4 border-r pr-4">
				<h3 className={"text-2xl font-semibold"}>List Categories</h3>
				<Table aria-label="Categories Table">
					<TableHeader columns={categoryColumns}>
						{(column) => (
							<TableColumn
								key={column.key}
								align={column.key === "action" ? "center" : "start"}
							>
								{column.label}
							</TableColumn>
						)}
					</TableHeader>
					<TableBody items={categories}>
						{(item) => (
							<TableRow key={item.category_id}>
								{(columnKey) => {
									switch (columnKey) {
										case "category_name":
											return (
												<TableCell>
													<Chip
														classNames={{
															base: `background-${getKeyValue(item, "color")} text-white`,
														}}
													>
														{getKeyValue(item, columnKey)}
													</Chip>
												</TableCell>
											);
										case "action":
											return (
												<TableCell className={"flex justify-center items-center gap-1"}>
													<Button
														isIconOnly
														color={"warning"}
														variant={"ghost"}
														onPress={() => onEdit(item)}
													>
														{SYS_ICONS.EDIT.MD}
													</Button>
													<Button
														isIconOnly
														color={"danger"}
														variant={"ghost"}
														onPress={() => onDelete(item.category_id)}
													>
														{SYS_ICONS.TRASH.MD}
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
			</div>
			<div className={"col-span-2 flex flex-col gap-4"}>
				<div className={"flex items-center justify-between"}>
					<h3 className={"text-2xl font-semibold"}>{formAction === "add" ? "Add new" : "Edit"} Category</h3>
					{formAction === "edit" && (
						<Button
							color={"danger"}
							startContent={SYS_ICONS.XMARK.MD}
							onPress={() => {
								setFormAction("add");
								setSelectedCategory(undefined);
							}}
						>
							Cancel
						</Button>
					)}
				</div>
				<CategoryForm
					action={formAction}
					categoryInfo={selectedCategory}
					onSuccess={onSuccess}
				/>
			</div>
		</div>
	);
}
