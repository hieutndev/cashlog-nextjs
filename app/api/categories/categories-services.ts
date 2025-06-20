// write for me a GET endpoint to get all categories

import { ResultSetHeader, RowDataPacket } from "mysql2";
import { JSONSchemaType } from "ajv";

import { dbQuery } from "@/libs/mysql";
import { QUERY_STRING } from "@/config/query-string";
import { TCategory, TNewCategory } from "@/types/category";
import { ApiError } from "@/types/api-error";

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


export const getAllCategories = async (userId?: string | number) => {
  try {
    const listCategories = await dbQuery<RowDataPacket[]>(
      userId ? QUERY_STRING.GET_ALL_CATEGORIES_OF_USER : QUERY_STRING.GET_ALL_CATEGORIES,
      userId ? [userId] : undefined,
    );

    if (!listCategories) {
      return [];
    }

    return listCategories;

  } catch (error: unknown) {
    throw new ApiError(error instanceof Error ? error.message : "Error in getAllCategories", 500);
  }
};

// handle get category by Id
export const getCategoryById = async (categoryId: string | number, userId?: string | number) => {
  let categoryInfo: TCategory[] | null = null;

  try {

    categoryInfo = await dbQuery<RowDataPacket[]>(
      QUERY_STRING.GET_CATEGORY_BY_ID,
      [categoryId],
    ) as TCategory[];

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

export const createNewCategory = async ({
  category_name,
  color,
}: TNewCategory, userId: string | number) => {
  let createStatus: ResultSetHeader | null = null;

  try {
    createStatus = await dbQuery(QUERY_STRING.CREATE_NEW_CATEGORY, [
      category_name,
      color,
      userId,
    ]);
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
  userId: string | number,
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
    deleteStatus = await dbQuery(QUERY_STRING.REMOVE_CATEGORY, [categoryId, categoryId, userId]);
  } catch (error: unknown) {
    throw new ApiError(error instanceof Error ? error.message : "Error in deleteCategory", 500);
  }

  if (!deleteStatus || deleteStatus.affectedRows === 0) {
    throw new ApiError("Failed to remove category or category not found", 404);
  }

  return true;
};
