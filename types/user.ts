export type TUser = {
    user_id: number;
    username: string;
    email: string;
    password: string;
    created_at: string;
    updated_at: string;
    refresh_token: string;
    role: string;
    is_active: boolean;
};

export type TSignIn = Pick<TUser, "email" | "password">;

export type TSignUp = Pick<TUser, "email" | "password"> & {
    confirmPassword: string;
};

export type TSignInResponse = {
    user_id: string;
    username: string;
    email: string;
    access_token: string;
    refresh_token: string;
}