import * as crypto from "crypto";
export const randomUniqueString = (size = 32) => {
    return crypto.randomBytes(size).toString("hex");
}

export const sliceText = (text: string, numsSlice: number = 4): string => {
	const parseText = text.toString();

	try {
		return parseText.length <= numsSlice ? parseText : parseText.slice(0, numsSlice) + "...";
	} catch (error: unknown) {
		console.warn("🚀 ~ sliceText ~ unknown:", error)

		return error instanceof Error  ? error.message : "error";
	}
};
