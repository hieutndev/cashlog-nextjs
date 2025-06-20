import { NextResponse } from "next/server";

import {
  categorySchema,
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "../categories-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { validateRequest } from "@/utils/ajv";
import { ApiError } from "@/types/api-error";


interface CategoryDetailRouteProps {
  params: Promise<{ categoryId: string }>;
};

export async function GET(
  request: Request,
  { params }: CategoryDetailRouteProps
) {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const { categoryId } = await params;

    if (isNaN(Number(categoryId))) {
      return handleError(new ApiError("Invalid category ID", 404));
    }

    const category = await getCategoryById(categoryId, userId);

    if (!category) {
      return handleError(new ApiError("Category not found", 404));
    }

    return NextResponse.json(
      {
        status: "success",
        message: "Retrieved category information successfully",
        results: category,
      },
      { status: 200 },
    );

  } catch (error: unknown) {
    console.log("Error fetching category by ID:", error);

    return handleError(error)
  }
}

export async function PUT(
  request: Request,
  { params }: CategoryDetailRouteProps,
) {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const { categoryId } = await params;

    if (isNaN(Number(categoryId))) {
      return handleError(new ApiError("Invalid category ID", 404));
    }

    const requestBody = await request.json();

    const { isValid, errors } = validateRequest(categorySchema, requestBody);

    if (!isValid) {
      return handleValidateError(errors);
    }

    if (await updateCategory(categoryId, requestBody, userId)) {
      return NextResponse.json({
        status: "success",
        message: "Category updated successfully",
      }, {
        status: 202,
      });
    }

  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: CategoryDetailRouteProps,
) {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const { categoryId } = await params;

    if (isNaN(Number(categoryId))) {
      return handleError(new ApiError("Invalid category ID", 404));
    }

    if (await deleteCategory(categoryId, userId)) {
      return NextResponse.json({
        status: "success",
        message: "Category deleted successfully",
      }, {
        status: 200,
      });
    }
  } catch (error: unknown) {
    return handleError(error);
  }
}
