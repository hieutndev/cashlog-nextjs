

import jwt from "jsonwebtoken";

import { TUser } from "@/types/user";

const JWT_SECRET = process.env.JWT_SECRET;

export async function generateAccessToken(accountDetails: TUser) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(accountDetails, JWT_SECRET, { expiresIn: "1h" });
}

export async function generateRefreshToken(userId: string | number) {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: "24h" });
}

export async function verifyToken(token: string): Promise<any> {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.verify(token, JWT_SECRET);
}