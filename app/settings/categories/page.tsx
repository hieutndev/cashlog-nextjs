"use client";

import {getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {useEffect, useState} from "react";
import {addToast} from "@heroui/toast";
import {Chip} from "@heroui/chip";
import {Button} from "@heroui/button";
import clsx from "clsx";
import {Spinner} from "@heroui/spinner";

import CategoryForm from "./_component/category-form";

import {TCategory} from "@/types/category";
import {useFetch} from "@/hooks/useFetch";
import {IAPIResponse} from "@/types/global";
import SYS_ICONS from "@/configs/icons";
import useScreenSize from "@/hooks/useScreenSize";
import {BREAK_POINT} from "@/configs/break-point";

const categoryColumns = [
    {key: "category_name", label: "Category"},
    {key: "action", label: "Action"},
];

export default function CategoriesPage() {
    const {width} = useScreenSize();

    const [formAction, setFormAction] = useState<"add" | "edit">("add");
    const [selectedCategory, setSelectedCategory] = useState<TCategory | undefined>(undefined);

    // HANDLE FETCH CATEGORY

    const [categories, setCategories] = useState<TCategory[]>([]);

    const {
        data: fetchCategoriesResult,
        loading: loadingCategories,
        error: fetchCategoriesError,
        fetch: fetchCategories,
    } = useFetch<IAPIResponse<TCategory[]>>(`/categories`);

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

    // HANDLE DELETE CATEGORY

    const [selectedDeleteCategory, setSelectedDeleteCategory] = useState<number | null>(null);

    const {
        data: deleteCategoryResult,
        error: deleteCategoryError,
        fetch: deleteCategory,
    } = useFetch<IAPIResponse>(`categories/${selectedDeleteCategory}`, {
        method: "DELETE",
        skip: true,
    });

    useEffect(() => {
        if (selectedDeleteCategory) {
            deleteCategory();
        }
    }, [selectedDeleteCategory]);

    useEffect(() => {
        if (deleteCategoryResult) {
            addToast({
                color: "success",
                description: deleteCategoryResult.message,
                title: "Success",
            });
            fetchCategories();
        }

        if (deleteCategoryError) {
            const parseError = JSON.parse(deleteCategoryError);

            addToast({
                color: "danger",
                description: parseError.message || "An error occurred while deleting the category.",
                title: "Error",
            });
        }
    }, [deleteCategoryResult, deleteCategoryError]);

    // HANDLE ACTIONS

    const onSuccess = async () => {
        await fetchCategories();
        setFormAction("add");
    };

    const onEdit = (category: TCategory) => {
        setFormAction("edit");
        setSelectedCategory(category);
    };

    return (
        <div
            className={clsx("grid grid-cols-12 gap-4", {
                "col-span-10": width > BREAK_POINT.L,
                "col-span-12": width <= BREAK_POINT.L,
            })}
        >
            {loadingCategories ? (
                <div className={"w-full col-span-12 flex justify-center items-center h-full"}>
                    <Spinner size={"lg"}>Loading...</Spinner>
                </div>
            ) : (
                <>
                    <div
                        className={clsx("flex flex-col gap-4", {
                            "col-span-6 border-r pr-4": width >= BREAK_POINT.S,
                            "col-span-12 border-b border-gray-200  pb-4": width < BREAK_POINT.S,
                        })}
                    >
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
                            <TableBody
                                emptyContent={"No categories found"}
                                items={categories}
                            >
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
                                                                onPress={() =>
                                                                    setSelectedDeleteCategory(item.category_id)
                                                                }
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
                    <div
                        className={clsx("flex flex-col gap-4", {
                            "col-span-6": width >= BREAK_POINT.S,
                            "col-span-12": width < BREAK_POINT.S,
                        })}
                    >
                        <div className={"flex items-center justify-between"}>
                            <h3 className={"text-2xl font-semibold"}>
                                {formAction === "add" ? "Add new" : "Edit"} Category
                            </h3>
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
                </>
            )}
        </div>
    );
}
