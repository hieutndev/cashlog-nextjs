import { Input } from "@heroui/input";
import { Radio, RadioGroup } from "@heroui/radio";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Divider } from "@heroui/divider";
import { Chip } from "@heroui/chip";
import { ErrorObject } from "ajv";
import { addToast } from "@heroui/toast";
import { useFetch } from "hieutndev-toolkit";

import CustomForm from "@/components/shared/form/custom-form";
import { IAPIResponse, ListColors } from "@/types/global";
import { TCategory, TNewCategory } from "@/types/category";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";

interface NewCategoryProps {
	categoryInfo?: TCategory;
	onSuccess?: () => void;
	action?: "add" | "edit";
}

export default function CategoryForm({ categoryInfo, onSuccess, action = "add" }: NewCategoryProps) {
	const [categoryForm, setCategoryForm] = useState<TNewCategory>({
		category_name: "",
		color: "red",
	});

	const [validateErrors, setValidateErrors] = useState<ErrorObject[]>([]);

	const resetForm = () => {
		setCategoryForm({
			category_name: "",
			color: "red",
		});
		setValidateErrors([]);
	};

	const getActionRoute = (action: string) => {
		const MAP_ACTION_ROUTE: Record<string, string> = {
			add: "/categories",
			edit: `/categories/${categoryInfo?.category_id}`,
		};

		return MAP_ACTION_ROUTE[action];
	};

	const {
		data: formActionResult,
		// loading: formActionLoading,
		error: formActionError,
		fetch: formAction,
	} = useFetch<IAPIResponse>(getActionRoute(action), {
		method: action === "add" ? "POST" : "PUT",
		body: categoryForm,
		headers: {
			"Content-Type": "application/json",
		},
		skip: true,
	});

	useEffect(() => {
		if (formActionResult) {
			if (formActionResult.status === "success") {
				addToast({
					title: "Success",
					description: formActionResult.message,
					color: "success",
				});

				resetForm();
				if (onSuccess) {
					onSuccess();
				}
			}
		}

		if (formActionError) {
			const parseError = JSON.parse(formActionError);

			if (parseError.validateErrors) {
				setValidateErrors(parseError.validateErrors);
			} else {
				addToast({
					color: "danger",
					description: parseError.message || "An error occurred while creating the category.",
					title: "Error",
				});
			}
		}
	}, [formActionResult, formActionError]);

	useEffect(() => {
		console.log(categoryInfo);

		if (categoryInfo) {
			setCategoryForm({
				category_name: categoryInfo.category_name,
				color: categoryInfo.color,
			});
		} else {
			resetForm();
		}
	}, [categoryInfo]);

	return (
		<CustomForm
			className={"flex flex-col gap-4"}
			formId={"addNewCategory"}
			submitButtonSize={"lg"}
			submitButtonText={action === "add" ? "Create new Category" : "Update Category"}
			onSubmit={formAction}
		>
			<Input
				isRequired
				errorMessage={getFieldError(validateErrors, "category_name")?.message}
				isInvalid={!!getFieldError(validateErrors, "category_name")}
				label={"Category Name"}
				labelPlacement={"outside"}
				name={"category_name"}
				placeholder={"Enter category name"}
				size={"lg"}
				value={categoryForm.category_name}
				variant={"bordered"}
				onValueChange={(e) =>
					setForm<TNewCategory>("category_name", e, validateErrors, setValidateErrors, setCategoryForm)
				}
			/>
			<RadioGroup
				errorMessage={getFieldError(validateErrors, "color")?.message}
				isInvalid={!!getFieldError(validateErrors, "color")}
				label={"Select Color"}
				name={"color"}
				value={categoryForm.color}
				onValueChange={(e) =>
					setForm<TNewCategory>("color", e, validateErrors, setValidateErrors, setCategoryForm)
				}
			>
				<div className={"flex flex-wrap gap-2"}>
					{ListColors.map((color) => (
						<Radio
							key={color}
							className={"capitalize"}
							classNames={{
								label: "flex items-center gap-1",
							}}
							value={color}
						>
							<div className={clsx("w-6 h-6 bg-gradient-to-br rounded-md", `background-${color}`)} />
							{color}
						</Radio>
					))}
				</div>
			</RadioGroup>
			<Divider />
			<div className={"flex sm:flex-row flex-col sm:items-center gap-2"}>
				<p className={"text-sm"}>Preview:</p>
				<Chip
					classNames={{
						base: `background-${categoryForm.color} text-white`,
					}}
				>
					{categoryForm.category_name || "Category Name Here"}
				</Chip>
			</div>
		</CustomForm>
	);
}
