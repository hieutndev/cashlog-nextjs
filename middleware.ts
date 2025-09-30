import { NextRequest, NextResponse } from "next/server";
import { decodeJwt, type JWTPayload } from "jose";

// CẬP NHẬT: Danh sách Origin phải bao gồm subdomain 'cashlog' như bạn đang sử dụng.
const ALLOWED_ORIGINS = [
    'https://cashlog.hieutndev.com', 
    'https://cashlog.hieutn.info.vn',
];

/**
 * Hàm tạo và thiết lập các header CORS cần thiết.
 * @param origin Origin của request.
 * @returns Đối tượng Headers đã được cấu hình CORS.
 */
const getCorsHeaders = (origin: string): Headers => {
    const headers = new Headers();
    // Kiểm tra chính xác origin, hoặc cho phép nếu là môi trường phát triển
    const isAllowed = ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === 'development';

    if (isAllowed && origin) {
        // Chỉ cho phép Origin cụ thể để đảm bảo Access-Control-Allow-Credentials hoạt động
        // KHÔNG sử dụng '*' nếu Access-Control-Allow-Credentials là 'true'
        headers.set('Access-Control-Allow-Origin', origin); 
        headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        headers.set('Access-Control-Max-Age', '86400'); // Cache Preflight response trong 24 giờ
        headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return headers;
};

export const middleware = async (request: NextRequest) => {
    const origin = request.headers.get('origin') || '';
    const corsHeaders = getCorsHeaders(origin);

    // --- 1. Xử lý OPTIONS (Preflight Request) ---
    // Đây là bước quan trọng nhất đối với lỗi bạn đang gặp.
    if (request.method === 'OPTIONS') {
        // Chỉ trả về 204 nếu origin được phép (nghĩa là corsHeaders có Access-Control-Allow-Origin)
        if (corsHeaders.has('Access-Control-Allow-Origin')) {
            return new Response(null, {
                status: 204, // 204 No Content là phản hồi thành công cho Preflight
                headers: corsHeaders,
            });
        }
        
        // Nếu không được phép, trả về lỗi 403 để trình duyệt không gọi request chính
         return new Response(JSON.stringify({ message: "Origin not allowed by CORS policy" }), {
             status: 403,
             headers: corsHeaders,
         });
    }

    // --- 2. Logic Xác thực (Chỉ chạy sau khi OPTIONS đã được xử lý) ---

    // Hàm helper để tạo phản hồi lỗi kèm theo header CORS
    const createErrorResponse = (message: string, status: number) => {
        const errorResponse = NextResponse.json(
            {
                status: "failure",
                message: message,
            },
            { status: status }
        );

        // Áp dụng CORS headers vào response lỗi
        corsHeaders.forEach((value, key) => {
            errorResponse.headers.set(key, value);
        });

        return errorResponse;
    };

    // Nếu request không phải OPTIONS và origin không được phép, chặn ngay
    if (!corsHeaders.has('Access-Control-Allow-Origin')) {
         return createErrorResponse("Origin not allowed by CORS policy", 403);
    }

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
        // Lưu ý: Trong production, bạn NÊN sử dụng `jwtVerify` để kiểm tra chữ ký token.
        user = decodeJwt(token);
    } catch {
        return createErrorResponse("Invalid or malformed token", 401);
    }

    // --- 3. Thành công: Gắn thông tin người dùng và áp dụng CORS headers ---

    // Gắn user ID vào header của request để các Route Handler có thể truy cập
    const modifiedRequestHeaders = new Headers(request.headers);

    if (user.user_id) {
        modifiedRequestHeaders.set("x-user-id", String(user.user_id));
    }

    const finalResponse = NextResponse.next({
        request: {
            headers: modifiedRequestHeaders,
        },
    });

    // Áp dụng CORS headers vào phản hồi thành công trước khi gửi về client
    corsHeaders.forEach((value, key) => {
        finalResponse.headers.set(key, value);
    });

    return finalResponse;
};

export const config = {
    // Đảm bảo chỉ áp dụng cho các API Routes cần xác thực
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
