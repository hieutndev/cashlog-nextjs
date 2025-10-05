import { NextResponse } from "next/server";

import {
  deleteCategory,
  getCategoryById,
  updateCategory,
  updateCategoryPayload,
} from "../categories-services";
import { handleError, handleValidateError } from "../../_helpers/handle-error";
import { getFromHeaders } from "../../_helpers/get-from-headers";

import { zodValidate } from "@/utils/zod-validate";
import { TUser } from "@/types/user";


interface CategoryDetailRouteProps {
  params: Promise<{ category_id: string }>;
};

export async function GET(
  request: Request,
  { params }: CategoryDetailRouteProps
) {
  try {
    const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);
    const { category_id } = await params;

    return NextResponse.json(
      {
        status: "success",
        message: "Retrieved category information successfully",
        results: await getCategoryById(Number(category_id), Number(userId)),
      },
      { status: 200 },
    );

  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function PUT(
  request: Request,
  { params }: CategoryDetailRouteProps,
) {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const { category_id } = await params;

    const requestBody = await request.json();

    const { is_valid, errors } = zodValidate(updateCategoryPayload, requestBody);

    if (!is_valid) {
      return handleValidateError(errors);
    }

    if (await updateCategory(Number(category_id), requestBody, Number(userId))) {
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
    const { category_id } = await params;

    if (await deleteCategory(Number(category_id), Number(userId))) {
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
