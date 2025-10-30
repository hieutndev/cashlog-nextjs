import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { Chip } from "@heroui/chip";
import { addToast } from "@heroui/toast";

import { useCategoryFormEndpoint } from "@/hooks/useCategoryFormEndpoint";
import { ZodCustomError } from "@/types/zod";
import CustomForm from "@/components/shared/form/custom-form";
import ColorPicker from "@/components/shared/color-picker";
import { TCategory, TAddCategoryPayload } from "@/types/category";
import { ensureHexColor } from "@/utils/color-conversion";
import { getFieldError } from "@/utils/get-field-error";

interface NewCategoryProps {
	categoryInfo?: TCategory;
	onSuccess?: () => void;
	action?: "add" | "edit";
}

export default function CategoryForm({ categoryInfo, onSuccess, action = "add" }: NewCategoryProps) {
	const { useCreateCategory, useUpdateCategory } = useCategoryFormEndpoint();
	const [categoryForm, setCategoryForm] = useState<TAddCategoryPayload>({
		category_name: "",
		color: "#6366F1",
	});

	const [validateErrors, setValidateErrors] = useState<ZodCustomError[]>([]);

	const resetForm = () => {
		setCategoryForm({
			category_name: "",
			color: "#6366F1",
		});
		setValidateErrors([]);
	};

	const createCategory = useCreateCategory();
	const updateCategory = useUpdateCategory(categoryInfo?.category_id ?? -1);

	const {
		data: formActionResult,
		loading: formActionLoading,
		error: formActionError,
		fetch: formAction,
	} = action === "add" ? createCategory : updateCategory;

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

	const handleSubmitForm = () => {
		formAction({
			body: categoryForm,
		});
	}

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
			isLoading={formActionLoading}
			loadingText={action === "add" ? "Adding..." : "Updating..."}
			submitButtonText={action === "add" ? "Add new Category" : "Update Category"}
			onSubmit={handleSubmitForm}
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
					setCategoryForm({ ...categoryForm, category_name: e })
				}
			/>
			<ColorPicker
				label="Category Color"
				value={ensureHexColor(categoryForm.color)}
				onChange={(color) => setCategoryForm({ ...categoryForm, color })}
			/>
			<div className={"flex sm:flex-row flex-col sm:items-center gap-2"}>
				<p className={"text-sm"}>Preview:</p>
				<Chip
					className="text-white"
					style={{ backgroundColor: ensureHexColor(categoryForm.color) }}
				>
					{categoryForm.category_name || "Category Name Here"}
				</Chip>
			</div>
		</CustomForm>
	);
}
