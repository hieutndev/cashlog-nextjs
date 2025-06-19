import { TColor } from "./global";

export type TCategory = {
    category_id: string;
    category_name: string;
    color: TColor;
    user_id: number;
    created_at: string;
    updated_at: string;
}

export type TNewCategory = Pick<TCategory, "category_name" | "color">;

