import { NextResponse } from "next/server";
import { decodeJwt } from "jose";

import { handleError } from "../../_helpers/handle-error"
import { getUserById } from "../user-services";

import { ApiError } from "@/types/api-error";

export const POST = async (request: Request) => {
    try {

        const requestBody = await request.json();

        const { refresh_token } = requestBody;

        if (!refresh_token) {
            return NextResponse.json({
                status: 'success',
                message: 'Empty refresh_token',
            }, {
                status: 200
            })
        }

        const user = await decodeJwt(refresh_token) as { user_id: string };

        if (!user) {
            return handleError(new ApiError("Invalid refresh token", 404));
        }

        const userInfo = await getUserById(user.user_id!);

        if (!userInfo) {
            return handleError(new ApiError("Invalid refresh token", 404));
        }

        return NextResponse.json({
            status: 'success',
            message: 'Valid sessions',
        }, {
            status: 200
        })


    } catch (error: unknown) {
        return handleError(error);
    }
}