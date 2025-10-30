import { TUser } from "./user";

export type TCategory = {
    category_id: number;
    category_name: string;
    color: string; // Now supports both HEX (#RRGGBB) and legacy color names
    user_id: TUser['user_id'];
    created_at: string;
    updated_at: string;
}

export type TAddCategoryPayload = Pick<TCategory, "category_name" | "color">;

export type TUpdateCategoryPayload = TAddCategoryPayload;

