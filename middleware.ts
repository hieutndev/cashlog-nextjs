import { NextRequest, NextResponse } from "next/server";
import { decodeJwt, type JWTPayload } from "jose";

// CẬP NHẬT: Danh sách Origin phải bao gồm subdomain 'cashlog' như bạn đang sử dụng.
// const ALLOWED_ORIGINS = [
//     'https://cashlog.hieutndev.com',
//     'https://cashlog.hieutn.info.vn',
// ];

const getCorsHeaders = (): Headers => {
    const headers = new Headers();

    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    headers.set('Access-Control-Max-Age', '86400');
    headers.set('Access-Control-Allow-Credentials', 'false');

    return headers;
};

export const middleware = async (request: NextRequest) => {
    const corsHeaders = getCorsHeaders();

    // Handle preflight OPTIONS requests
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    // --- Authentication Logic (Only runs after OPTIONS is handled) ---

    // Helper function to create error response with CORS headers
    const createErrorResponse = (message: string, status: number) => {
        const errorResponse = NextResponse.json(
            {
                status: "failure",
                message: message,
            },
            { status: status }
        );

        // Apply CORS headers to error response
        corsHeaders.forEach((value, key) => {
            errorResponse.headers.set(key, value);
        });

        return errorResponse;
    };

    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
        return createErrorResponse("Missing Authorization header", 401);
    }

    const parts = authHeader.split(" ");

    // Kiểm tra định dạng Bearer Token
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        return createErrorResponse("Invalid Authorization header format", 401);
    }

    const token = parts[1];
    let user: JWTPayload & { user_id?: string | number };

    try {
        // Note: In production, you should use `jwtVerify` to verify the token signature.
        user = decodeJwt(token);
    } catch {
        return createErrorResponse("Invalid or malformed token", 401);
    }

    // --- Success: Attach user information and apply CORS headers ---

    // Attach user ID to request headers so Route Handlers can access it
    const modifiedRequestHeaders = new Headers(request.headers);

    if (user.user_id) {
        modifiedRequestHeaders.set("x-user-id", String(user.user_id));
    }

    const finalResponse = NextResponse.next({
        request: {
            headers: modifiedRequestHeaders,
        },
    });

    // Apply CORS headers to successful response before sending to client
    corsHeaders.forEach((value, key) => {
        finalResponse.headers.set(key, value);
    });

    return finalResponse;
};

export const config = {
    // Apply only to API Routes that need authentication
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
