import { LIST_COLORS } from "@/types/global";

export const randomCardColor = () => {
	return LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)];
};
