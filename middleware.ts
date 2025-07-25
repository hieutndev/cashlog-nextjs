// write middleware to check access_token in Authorization header

import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

export const middleware = async (request: NextRequest) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
        return NextResponse.json(
            {
                status: "failure",
                message: "Missing Authorization header",
            },
            { status: 401 }
        );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return NextResponse.json(
            {
                status: "failure",
                message: "Missing token",
            },
            { status: 401 }
        );
    }

    // Verify token using jose library

    let user;

    try {
        user = decodeJwt(token);
    } catch {
        return NextResponse.json(
            {
                status: "failure",
                message: "Invalid token",
            },
            { status: 401 }
        );
    }

    const responseHeaders = new Headers(request.headers);

    responseHeaders.set("x-user-id", String(user.user_id));

    return NextResponse.next({
        request: {
            // New request headers
            headers: responseHeaders,
        },
    });
};

export const config = {
    matcher: [
        "/api/cards/:path*",
        "/api/transactions/:path*",
        "/api/categories/:path*",
        "/api/forecasts/:path*",
        "/api/analytics/:path*",
        "/api/settings/:path*",
        // "/api/users/x-rftk"
    ],
};