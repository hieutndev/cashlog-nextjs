import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { JSONSchemaType } from 'ajv';

import { TSignUp, TSignIn, TUser } from '../../../types/user';

import { dbQuery } from '@/libs/mysql';
import { QUERY_STRING } from '@/configs/query-string';
import { randomUniqueString } from '@/utils/string';
import { comparePassword, hashPassword } from '@/utils/hash-password';
import { generateAccessToken, generateRefreshToken, verifyToken } from '@/utils/jwt-utils';
import { ApiError } from '@/types/api-error';
import { REGEX } from '@/configs/regex';

export const signInSchema: JSONSchemaType<TSignIn> = {
    type: "object",
    properties: {
        email: { type: "string", format: "email", minLength: 1 },
        password: { type: "string", minLength: 1 },
    },
    required: ["email", "password"],
    additionalProperties: false,
};

export const signUpSchema: JSONSchemaType<TSignUp> = {
    type: "object",
    properties: {
        email: { type: "string", format: "email", minLength: 1 },
        password: { type: "string", minLength: 1, pattern: REGEX.PASSWORD },
        confirmPassword: { type: "string", minLength: 6 },
    },
    required: ["email", "password", "confirmPassword"],
    additionalProperties: false,
};

export const getUserByEmail = async (email: string): Promise<TUser | null> => {

    try {
        const userInfo = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_USER_BY_EMAIL, [email]);

        if (userInfo.length === 0) {
            return null;
        }

        return userInfo[0] as TUser;
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in getUserByEmail", 500);
    }

};

export const getUserById = async (userId: string | number): Promise<TUser | null> => {
    try {
        const userInfo = await dbQuery<RowDataPacket[]>(QUERY_STRING.GET_USER_BY_ID, [userId]);

        if (userInfo.length === 0) {
            return null;
        }

        return userInfo[0] as TUser;
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in getUserById", 500);
    }

};

export const createNewUser = async ({ email, password, confirmPassword }: TSignUp) => {

    let existingUser: TUser | null;

    try {
        existingUser = await getUserByEmail(email);
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in createNewUser", 500);
    }
    // Check if user already exists
    if (existingUser) {
        throw new ApiError("User already exists", 400);
    }

    if (password !== confirmPassword) {
        throw new ApiError("Passwords do not match", 404);
    }

    let newUser: ResultSetHeader | null = null;

    try {
        newUser = await dbQuery<ResultSetHeader>(QUERY_STRING.CREATE_NEW_USER, [randomUniqueString(10), email, await hashPassword(password)]);
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in createNewUser", 500);
    }

    if (newUser.affectedRows === 0) {
        throw new ApiError("Failed to create new user", 500);
    }

    return newUser.insertId;



}

export const signIn = async ({ email, password }: TSignIn) => {

    let userInfo: TUser | null;

    try {

        userInfo = await getUserByEmail(email);

    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in signIn", 500);
    }

    if (!userInfo) {
        throw new ApiError("User not found", 404);
    }

    if (!await comparePassword(password, userInfo.password)) {
        throw new ApiError("Wrong password", 404);
    }


    let accessToken: string = '';
    let refreshToken: string = '';

    try {
        accessToken = await generateAccessToken(userInfo);
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Failed to generate access token", 500);
    }

    try {
        refreshToken = await generateRefreshToken(userInfo.user_id);
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Failed to generate refresh token", 500);
    }

    try {
        await updateRefreshToken(userInfo.user_id, refreshToken);
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Failed to update refresh token", 500);
    }

    return {
        user_id: userInfo.user_id,
        username: userInfo.username,
        email: userInfo.email,
        access_token: accessToken,
        refresh_token: refreshToken
    };
}

export const updateRefreshToken = async (userId: string | number, refreshToken: string) => {

    let updateStatus: ResultSetHeader | null = null;

    try {
        updateStatus = await dbQuery<ResultSetHeader>(QUERY_STRING.UPDATE_REFRESH_TOKEN, [refreshToken, userId]);
    } catch (error: unknown) {
        throw new ApiError((error as Error).message || "Error in updateRefreshToken", 500);
    }

    if (updateStatus.affectedRows === 0) {
        throw new ApiError("Failed to update refresh token", 500);
    }

    return true;

}

export const getNewAccessToken = async (xRftk: string) => {
    let decodedToken: { user_id: string | number } | null = null;

    try {
        decodedToken = await verifyToken(xRftk);
    }
    catch (error: unknown) {
        throw new ApiError((error as Error).message || "Failed to verify refresh token", 500);
    }

    if (!decodedToken) {
        throw new ApiError("Invalid refresh token", 401);
    }

    const { user_id } = decodedToken;

    const userInfo = await getUserById(user_id);

    if (!userInfo) {
        throw new ApiError("User not found", 404);
    }


    if (userInfo.refresh_token !== xRftk) {
        throw new ApiError("Refresh token does not match", 401);
    }

    try {
        const newAccessToken = await generateAccessToken(userInfo);

        return newAccessToken;
    } catch (error: any) {
        throw new ApiError((error as Error).message || "Failed to generate new access token", 500);
    }
}