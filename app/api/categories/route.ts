import { NextResponse } from "next/server";

import { handleError, handleValidateError } from "../_helpers/handle-error";
import { getFromHeaders } from "../_helpers/get-from-headers";

import { addCategoryPayload, addNewCategory, getAllCategoriesOfUser } from "./categories-services";

import { zodValidate } from "@/utils/zod-validate";
import { TUser } from "@/types/user";

export async function GET(request: Request) {
	try {
		const userId = getFromHeaders<TUser['user_id']>(request, "x-user-id", 0);

		return NextResponse.json({
			status: "success",
			message: "Retrieved all categories successfully",
			results: await getAllCategoriesOfUser(userId),
		});
	} catch (error: unknown) {
		return handleError(error);
	}
}

export async function POST(request: Request) {
	try {
		const userId = getFromHeaders(request, "x-user-id", "");
		const requestBody = await request.json();

		const { is_valid, errors } = zodValidate(addCategoryPayload, requestBody);

		if (!is_valid) {
			return handleValidateError(errors);
		}

		return NextResponse.json(
			{
				status: "success",
				message: "Created new category successfully",
				results: await addNewCategory(requestBody, userId),
			},
			{ status: 201 }
		);
	} catch (error: unknown) {
		return handleError(error);
	}
}
