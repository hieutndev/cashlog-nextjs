import { ResultSetHeader, RowDataPacket } from "mysql2";
import { JSONSchemaType } from "ajv";

import { dbQuery } from "@/libs/mysql";
import { QUERY_STRING } from "@/configs/query-string";
import { TCategory, TNewCategory } from "@/types/category";
import { ApiError } from "@/types/api-error";
import { TUser } from "@/types/user";
import { randomCardColor } from "@/utils/random-color";

export const categorySchema: JSONSchemaType<{
	category_name: string;
	color: string;
}> = {
	type: "object",
	properties: {
		category_name: { type: "string", minLength: 3 },
		color: { type: "string" },
	},
	required: ["category_name", "color"],
	additionalProperties: false,
};

export const createMultiCategoriesSchema: JSONSchemaType<{ category_names: string[] }> = {
	type: "object",
	properties: {
		category_names: {
			type: "array",
			items: { type: "string", minLength: 1 },
			minItems: 1,
		},
	},
	required: ["category_names"],
	additionalProperties: false,
};

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
export const getCategoryById = async (categoryId: string | number, userId?: string | number) => {
	let categoryInfo: TCategory[] | null = null;

	try {
		categoryInfo = (await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CATEGORY_BY_ID, [categoryId])) as TCategory[];

		if (!categoryInfo || categoryInfo.length === 0) {
			return null;
		}
	} catch (error) {
		throw new ApiError((error as Error).message || "Error in getCategoryById", 500);
	}

	if (categoryInfo[0].user_id !== userId) {
		throw new ApiError("You do not have permission to retrieve this category info", 403);
	}

	return categoryInfo[0];
};

export const createNewCategory = async ({ category_name, color }: TNewCategory, userId: string | number) => {
	let createStatus: ResultSetHeader | null = null;

	try {
		createStatus = await dbQuery(QUERY_STRING.CREATE_NEW_CATEGORY, [category_name, color, userId]);
	} catch (error: unknown) {
		throw new ApiError(error instanceof Error ? error.message : "Error in createNewCategory", 500);
	}

	if (!createStatus || createStatus.affectedRows === 0) {
		throw new ApiError("Failed to create new category", 500);
	}

	return createStatus.insertId;
};

export const updateCategory = async (
	categoryId: string | number,
	{ category_name, color }: TNewCategory,
	userId: string | number
) => {
	let updateResult: ResultSetHeader | null = null;

	try {
		updateResult = await dbQuery<ResultSetHeader>(QUERY_STRING.UPDATE_CATEGORY, [
			category_name,
			color,
			categoryId,
			userId,
		]);
	} catch (error: unknown) {
		throw new ApiError(error instanceof Error ? error.message : "Error in updateCategory", 500);
	}

	if (!updateResult || updateResult.affectedRows === 0) {
		throw new ApiError("Failed to update category or category not found", 404);
	}

	return true;
};

export const deleteCategory = async (categoryId: string | number, userId: string | number) => {
	let deleteStatus: ResultSetHeader | null = null;

	try {
		deleteStatus = await dbQuery(QUERY_STRING.REMOVE_CATEGORY, [categoryId, userId]);
	} catch (error: unknown) {
		throw new ApiError(error instanceof Error ? error.message : "Error in deleteCategory", 500);
	}

	if (!deleteStatus || deleteStatus.affectedRows === 0) {
		throw new ApiError("Failed to remove category or category not found", 404);
	}

	return true;
};

export const validateCategories = async (category_names: string[], user_id: TUser["user_id"]) => {
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

const validateCategoryName = async (categoryName: string, userId: TUser["user_id"]): Promise<boolean> => {
	const query = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_CATEGORY_BY_NAME, [categoryName, userId]);

	return query.length === 0;
};

export const createMultipleCategories = async (category_names: string[], user_id: TUser["user_id"]) => {
	try {
		let baseQuery: string = "";
		let baseValues: any[] = [];
		let createdNew: number = 0;

		const willCreate = await Promise.all(
			category_names.map(async (category) => {
				if (await validateCategoryName(category, user_id)) {
					return category;
				}
			})
		);

		willCreate
			.filter((_v) => _v)
			.forEach(async (category) => {
				baseQuery += QUERY_STRING.CREATE_NEW_CATEGORY;
				baseValues.push([category, randomCardColor(), user_id]);
				createdNew++;
			});

		if (baseQuery) {
			await dbQuery<ResultSetHeader>(baseQuery, baseValues.flat());
		}

		return {
			created_new: createdNew,
			user_categories: await getAllCategoriesOfUser(user_id),
		};
	} catch (error: unknown) {
		throw new ApiError(error instanceof Error ? error.message : "Error in createMultipleCategories", 500);
	}
};
