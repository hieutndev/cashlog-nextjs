import { NextResponse } from "next/server";
import { JSONSchemaType } from "ajv";

import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { createNewCategory, getAllCategories } from "./categories-services";

import { validateRequest } from "@/utils/ajv";

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
