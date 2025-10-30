import { ResultSetHeader, RowDataPacket } from "mysql2";
import { z } from "zod";

import { dbQuery } from "@/libs/mysql";
import { QUERY_STRING } from "@/configs/query-string";
import { TCategory, TAddCategoryPayload, TUpdateCategoryPayload } from "@/types/category";
import { ApiError } from "@/types/api-error";
import { TUser } from "@/types/user";
import { getRandomHexColor } from "@/utils/color-conversion";
import { VALIDATE_MESSAGE } from "@/utils/api/zod-validate-message";

// Zod schema for HEX color validation: #RRGGBB or #RRGGBBAA format
const hexColorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/, {
	message: "Color must be in HEX format (#RRGGBB or #RRGGBBAA)",
});

export const addCategoryPayload = z.object({
	category_name: z.string().min(1, { message: VALIDATE_MESSAGE.REQUIRED_VALUE }),
	color: hexColorSchema,
});

export const updateCategoryPayload = addCategoryPayload;

export const createMultipleCategoriesPayload = z.object({
	category_names: z.array(z.string().min(1)).min(1)
}).optional();

export const createBulkCategoriesPayload = z.object({
	categories: z.array(z.object({
		category_name: z.string().min(1, { message: VALIDATE_MESSAGE.REQUIRED_VALUE }),
		color: hexColorSchema,
	})).min(1)
});

export const categorizeCategoriesPayload = z.object({
	category_names: z.array(z.string().min(1)).min(1)
});

export const getAllCategoriesOfUser = async (userId: TUser["user_id"]): Promise<TCategory[]> => {
	try {
		const listCategories = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_ALL_CATEGORIES_OF_USER, [userId]);

		if (!listCategories) {
			return [];
		}

		return listCategories as TCategory[];
	} catch (error: unknown) {
		throw new ApiError(error instanceof Error ? error.message : "Error in getAllCategories", 500);
	}
};

// handle get category by Id
export const getCategoryById = async (categoryId: TCategory['category_id'], userId: TUser['user_id']) => {

	const categoryInfo = (await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CATEGORY_BY_ID, [categoryId])) as TCategory[];

	if (!categoryInfo || categoryInfo.length === 0) {
		throw new ApiError("Category not found", 404);
	}

	await validateCategoryOwnership(categoryId, userId);

	return categoryInfo[0];
};

export const validateCategoryOwnership = async (categoryId: TCategory['category_id'], userId: TUser['user_id']) => {

	const categoryInfo = (await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CATEGORY_BY_ID, [categoryId])) as TCategory[];

	if (!categoryInfo || categoryInfo.length === 0) {
		throw new ApiError("Category not found", 404);
	}

	if (Number(categoryInfo[0].user_id) !== Number(userId)) {
		throw new ApiError("You do not have permission to access this category", 403);
	}

	return true;

}

export const addNewCategory = async ({ category_name, color }: TAddCategoryPayload, userId: string | number) => {
	const createStatus = await dbQuery(QUERY_STRING.CREATE_NEW_CATEGORY, [category_name, color, userId]);

	return createStatus.insertId;
};

export const updateCategory = async (
	category_id: TCategory['category_id'],
	{ category_name, color }: TUpdateCategoryPayload,
	user_id: TUser['user_id']
) => {
	await validateCategoryOwnership(category_id, user_id);

	await dbQuery<ResultSetHeader>(QUERY_STRING.UPDATE_CATEGORY, [
		category_name,
		color,
		category_id,
		user_id,
	]);

	return true;
};

export const deleteCategory = async (category_id: TCategory['category_id'], user_id: TUser['user_id']) => {

	await validateCategoryOwnership(category_id, user_id);

	await dbQuery(QUERY_STRING.REMOVE_CATEGORY, [category_id, user_id]);

	return true;
};

export const categorizeUserCategories = async (category_names: string[], user_id: TUser["user_id"]) => {
	try {
		const list_categories_of_user = (await getAllCategoriesOfUser(user_id)).map(
			({ category_name }) => category_name
		);

		const exists_categories: string[] = [];
		const missing_categories: string[] = [];

		category_names.forEach((categoryName) => {
			if (list_categories_of_user.includes(categoryName)) {
				exists_categories.push(categoryName);
			} else {
				missing_categories.push(categoryName);
			}
		});

		return {
			exists_categories,
			missing_categories,
		};
	} catch (error: unknown) {
		throw error;
	}
};

const hasCategory = async (categoryName: string, userId: TUser["user_id"]): Promise<boolean> => {
	const query = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CATEGORY_BY_NAME, [categoryName, userId]);

	return query.length > 0;
};

export const createMultipleCategories = async (category_names: string[], user_id: TUser["user_id"]) => {
	try {
		let base_query: string = "";
		let base_values: any[] = [];
		let was_created_count: number = 0;

		const creation_logs: {
			category_name: string;
			message: string;
		}[] = [];

		const should_create = await Promise.all(
			category_names.map(async (category) => {
				if (!await hasCategory(category, user_id)) {
					return category;
				} else {
					creation_logs.push({
						category_name: category,
						message: "Already Exists",
					});

					return null;
				}
			})
		);

		should_create
			.filter((_v) => _v)
			.forEach(async (category) => {
				base_query += QUERY_STRING.CREATE_NEW_CATEGORY;
				base_values.push([category, getRandomHexColor(), user_id]);
				was_created_count++;

				creation_logs.push({
					category_name: category as string,
					message: "New",
				});
			});

		if (base_query) {
			await dbQuery<ResultSetHeader>(base_query, base_values.flat());
		}

		return {
			was_created_count,
			user_categories: await getAllCategoriesOfUser(user_id),
			creation_logs
		};
	} catch (error: unknown) {
		throw new ApiError(error instanceof Error ? error.message : "Error in createMultipleCategories", 500);
	}
};

export const createBulkCategories = async (
	categories: Array<{ category_name: string; color: string }>,
	user_id: TUser["user_id"]
) => {
	try {
		let base_query: string = "";
		let base_values: any[] = [];
		let was_created_count: number = 0;

		const creation_logs: {
			category_name: string;
			message: string;
		}[] = [];

		const should_create = await Promise.all(
			categories.map(async (category) => {
				if (!await hasCategory(category.category_name, user_id)) {
					return category;
				} else {
					creation_logs.push({
						category_name: category.category_name,
						message: "Already Exists",
					});

					return null;
				}
			})
		);

		should_create
			.filter((_v) => _v)
			.forEach((category) => {
				if (category) {
					base_query += QUERY_STRING.CREATE_NEW_CATEGORY;
					base_values.push([category.category_name, category.color, user_id]);
					was_created_count++;

					creation_logs.push({
						category_name: category.category_name,
						message: "New",
					});
				}
			});

		if (base_query) {
			await dbQuery<ResultSetHeader>(base_query, base_values.flat());
		}

		return {
			was_created_count,
			user_categories: await getAllCategoriesOfUser(user_id),
			creation_logs
		};
	} catch (error: unknown) {
		throw new ApiError(error instanceof Error ? error.message : "Error in createBulkCategories", 500);
	}
};
