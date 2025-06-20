import { NextResponse } from "next/server";

import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { categorySchema, createNewCategory, getAllCategories } from "./categories-services";

import { validateRequest } from "@/utils/ajv";



export async function GET(request: Request) {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');

    return NextResponse.json({
      status: "success",
      message: "Retrieved all categories successfully",
      results: await getAllCategories(userId),
    });
  } catch (error: unknown) {
    return handleError(error)
  }
}

export async function POST(request: Request) {
  try {
    const userId = getFromHeaders(request, "x-user-id", '');
    const requestBody = await request.json();

    const { isValid, errors } = validateRequest(categorySchema, requestBody);

    if (!isValid) {
      return handleValidateError(errors);
    }

    return NextResponse.json(
      {
        status: "success",
        message: "Created new category successfully",
        results: await createNewCategory(requestBody, userId),
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}
