import { ListColors } from "@/types/global";

export const randomCardColor = () => {
	return ListColors[Math.floor(Math.random() * ListColors.length)];
};
